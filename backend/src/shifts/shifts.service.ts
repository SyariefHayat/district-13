import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  cashMovements,
  shifts,
  transactions,
} from '../drizzle/schema/index.js';
import type { CloseShiftDto } from './dto/close-shift.dto.js';
import type { CreateCashMovementDto } from './dto/create-cash-movement.dto.js';
import type { OpenShiftDto } from './dto/open-shift.dto.js';

@Injectable()
export class ShiftsService {
  constructor(private readonly database: DatabaseService) {}

  async open(input: OpenShiftDto, actor: AuthenticatedUser) {
    try {
      const [shift] = await this.database.db
        .insert(shifts)
        .values({
          userId: actor.id,
          openingCash: input.openingCash.toFixed(2),
          openedAt: new Date(),
        })
        .returning();
      return shift;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'An active shift already exists for this user',
        );
      }
      throw error;
    }
  }

  async getCurrent(actor: AuthenticatedUser) {
    const [shift] = await this.database.db
      .select()
      .from(shifts)
      .where(and(eq(shifts.userId, actor.id), isNull(shifts.closedAt)))
      .limit(1);
    return shift ?? null;
  }

  async list(actor: AuthenticatedUser) {
    const query = this.database.db.select().from(shifts);
    const rows =
      actor.role === 'CASHIER'
        ? await query
            .where(eq(shifts.userId, actor.id))
            .orderBy(desc(shifts.openedAt))
        : await query.orderBy(desc(shifts.openedAt));
    return rows;
  }

  async close(id: string, input: CloseShiftDto, actor: AuthenticatedUser) {
    return this.database.db.transaction(async (tx) => {
      const [shift] = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, id))
        .for('update');
      if (!shift) throw new NotFoundException('Shift not found');
      if (actor.role === 'CASHIER' && shift.userId !== actor.id) {
        throw new ForbiddenException(
          'Cashiers can only close their own shifts',
        );
      }
      if (shift.closedAt)
        throw new ConflictException('Shift is already closed');

      const [totals] = await tx
        .select({
          expectedCash: sql<string>`(${shifts.openingCash} + coalesce((select sum(${transactions.amount}) from ${transactions} where ${transactions.shiftId} = ${shifts.id} and ${transactions.paymentMethod} = 'CASH' and ${transactions.status} = 'VALID'), 0) + coalesce((select sum(case when ${cashMovements.type} = 'IN' then ${cashMovements.amount} else -${cashMovements.amount} end) from ${cashMovements} where ${cashMovements.shiftId} = ${shifts.id}), 0))::numeric(10, 2)`,
        })
        .from(shifts)
        .where(eq(shifts.id, id))
        .limit(1);

      const [closedShift] = await tx
        .update(shifts)
        .set({
          expectedCash: totals.expectedCash,
          closingCash: input.closingCash.toFixed(2),
          cashDifference: sql`${input.closingCash.toFixed(2)}::numeric - ${totals.expectedCash}::numeric`,
          closedAt: new Date(),
          closedBy: actor.id,
        })
        .where(and(eq(shifts.id, id), isNull(shifts.closedAt)))
        .returning();
      if (!closedShift) throw new ConflictException('Shift is already closed');
      return closedShift;
    });
  }

  async createCashMovement(
    id: string,
    input: CreateCashMovementDto,
    actor: AuthenticatedUser,
  ) {
    return this.database.db.transaction(async (tx) => {
      const [shift] = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, id))
        .for('update');
      if (!shift) throw new NotFoundException('Shift not found');
      if (shift.userId !== actor.id) {
        throw new ForbiddenException(
          'Cash movements must belong to your own shift',
        );
      }
      if (shift.closedAt)
        throw new ConflictException(
          'Closed shifts cannot accept cash movements',
        );

      const [movement] = await tx
        .insert(cashMovements)
        .values({
          shiftId: shift.id,
          recordedBy: actor.id,
          type: input.type,
          amount: input.amount.toFixed(2),
          description: input.description,
          createdAt: new Date(),
        })
        .returning();
      return movement;
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
