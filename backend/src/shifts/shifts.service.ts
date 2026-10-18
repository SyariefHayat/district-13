import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  lt,
  gte,
  sql,
  lte,
} from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  cashMovements,
  shifts,
  transactions,
} from '../drizzle/schema/index.js';
import type { CloseShiftDto } from './dto/close-shift.dto.js';
import type { CreateCashMovementDto } from './dto/create-cash-movement.dto.js';
import type { OpenShiftDto } from './dto/open-shift.dto.js';
import type { ListShiftsDto } from './dto/list-shifts.dto.js';
import { AuditLogsService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly database: DatabaseService,
    @Optional() private readonly auditLogs?: AuditLogsService,
  ) {}

  async open(input: OpenShiftDto, actor: AuthenticatedUser) {
    if (!roleHasPermission(actor.role, PERMISSIONS.shiftsOpen)) {
      throw new ForbiddenException('You cannot open a shift');
    }
    try {
      const create = async (tx: typeof this.database.db) => {
        const [created] = await tx
          .insert(shifts)
          .values({ userId: actor.id, openingCash: input.openingCash })
          .returning();
        if (created)
          await this.auditLogs?.record(
            {
              userId: actor.id,
              action: 'SHIFT_OPENED',
              entityType: 'SHIFT',
              entityId: created.id,
              description: 'Shift opened',
              metadata: { openingCash: input.openingCash },
            },
            tx,
          );
        return created;
      };
      const shift =
        typeof this.database.db.transaction === 'function'
          ? await this.database.db.transaction(create)
          : await create(this.database.db);
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

  async list(query: ListShiftsDto, actor: AuthenticatedUser) {
    if (
      query.startDate &&
      query.endDate &&
      new Date(query.startDate).getTime() > new Date(query.endDate).getTime()
    ) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const filters = [];
    if (!roleHasPermission(actor.role, PERMISSIONS.shiftsReadAll)) {
      filters.push(eq(shifts.userId, actor.id));
    } else if (query.userId) {
      filters.push(eq(shifts.userId, query.userId));
    }
    if (query.status === 'OPEN') filters.push(isNull(shifts.closedAt));
    if (query.status === 'CLOSED') filters.push(isNotNull(shifts.closedAt));
    if (query.startDate)
      filters.push(gte(shifts.openedAt, new Date(query.startDate)));
    if (query.endDate) {
      const end = parseEndDate(query.endDate);
      filters.push(
        end.exclusive
          ? lt(shifts.openedAt, end.date)
          : lte(shifts.openedAt, end.date),
      );
    }

    const filter = filters.length ? and(...filters) : undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, [total]] = await Promise.all([
      this.database.db
        .select()
        .from(shifts)
        .where(filter)
        .orderBy(desc(shifts.openedAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.db.select({ total: count() }).from(shifts).where(filter),
    ]);
    return { data, page, limit, total: Number(total.total) };
  }

  async getSummary(id: string, actor: AuthenticatedUser) {
    const [summary] = await this.database.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        openingCash: shifts.openingCash,
        expectedCash: shifts.expectedCash,
        closingCash: shifts.closingCash,
        cashDifference: shifts.cashDifference,
        openedAt: shifts.openedAt,
        closedAt: shifts.closedAt,
        closedBy: shifts.closedBy,
        transactionCount: sql<number>`(
          select count(*)::int from ${transactions}
          where ${transactions.shiftId} = ${shifts.id}
            and ${transactions.status} = 'COMPLETED'
        )`,
        cashSales: sql<string>`coalesce((
          select sum(${transactions.totalAmount}) from ${transactions}
          where ${transactions.shiftId} = ${shifts.id}
            and ${transactions.status} = 'COMPLETED'
            and ${transactions.paymentMethod} = 'CASH'
        ), 0)::numeric(10, 2)`,
        cashIn: sql<string>`coalesce((
          select sum(${cashMovements.amount}) from ${cashMovements}
          where ${cashMovements.shiftId} = ${shifts.id}
            and ${cashMovements.type} = 'IN'
        ), 0)::numeric(10, 2)`,
        cashOut: sql<string>`coalesce((
          select sum(${cashMovements.amount}) from ${cashMovements}
          where ${cashMovements.shiftId} = ${shifts.id}
            and ${cashMovements.type} = 'OUT'
        ), 0)::numeric(10, 2)`,
        calculatedExpectedCash: sql<string>`(
          ${shifts.openingCash}
          + coalesce((select sum(${transactions.totalAmount}) from ${transactions}
              where ${transactions.shiftId} = ${shifts.id}
                and ${transactions.status} = 'COMPLETED'
                and ${transactions.paymentMethod} = 'CASH'), 0)
          + coalesce((select sum(case when ${cashMovements.type} = 'IN'
              then ${cashMovements.amount} else -${cashMovements.amount} end)
              from ${cashMovements} where ${cashMovements.shiftId} = ${shifts.id}), 0)
        )::numeric(10, 2)`,
      })
      .from(shifts)
      .where(eq(shifts.id, id));

    if (!summary) throw new NotFoundException('Shift not found');
    if (
      !roleHasPermission(actor.role, PERMISSIONS.shiftsReadAll) &&
      summary.userId !== actor.id
    ) {
      throw new ForbiddenException('Cashiers can only view their own shifts');
    }

    return {
      shiftId: summary.id,
      status: summary.closedAt ? 'CLOSED' : 'OPEN',
      openingCash: summary.openingCash,
      expectedCash: summary.expectedCash ?? summary.calculatedExpectedCash,
      closingCash: summary.closingCash,
      cashDifference: summary.cashDifference,
      transactionCount: Number(summary.transactionCount),
      cashSales: summary.cashSales,
      cashIn: summary.cashIn,
      cashOut: summary.cashOut,
    };
  }

  async close(id: string, input: CloseShiftDto, actor: AuthenticatedUser) {
    return this.database.db.transaction(async (tx) => {
      const [shift] = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, id))
        .for('update');
      if (!shift) throw new NotFoundException('Shift not found');
      const canCloseAny = roleHasPermission(
        actor.role,
        PERMISSIONS.shiftsCloseAny,
      );
      const canCloseOwn = roleHasPermission(
        actor.role,
        PERMISSIONS.shiftsCloseOwn,
      );
      if (
        (!canCloseAny && !canCloseOwn) ||
        (!canCloseAny && shift.userId !== actor.id)
      ) {
        throw new ForbiddenException('You cannot close this shift');
      }
      if (shift.closedAt)
        throw new ConflictException('Shift is already closed');

      const [totals] = await tx
        .select({
          expectedCash: sql<string>`(${shifts.openingCash} + coalesce((select sum(${transactions.totalAmount}) from ${transactions} where ${transactions.shiftId} = ${shifts.id} and ${transactions.paymentMethod} = 'CASH' and ${transactions.status} = 'COMPLETED'), 0) + coalesce((select sum(case when ${cashMovements.type} = 'IN' then ${cashMovements.amount} else -${cashMovements.amount} end) from ${cashMovements} where ${cashMovements.shiftId} = ${shifts.id}), 0))::numeric(10, 2)`,
        })
        .from(shifts)
        .where(eq(shifts.id, id))
        .limit(1);

      const [closedShift] = await tx
        .update(shifts)
        .set({
          expectedCash: totals.expectedCash,
          closingCash: input.closingCash,
          cashDifference: sql`${input.closingCash}::numeric - ${totals.expectedCash}::numeric`,
          closedAt: new Date(),
          closedBy: actor.id,
        })
        .where(and(eq(shifts.id, id), isNull(shifts.closedAt)))
        .returning();
      if (!closedShift) throw new ConflictException('Shift is already closed');
      await this.auditLogs?.record(
        {
          userId: actor.id,
          action:
            canCloseAny && shift.userId !== actor.id
              ? 'SHIFT_CLOSED_BY_SUPERVISOR'
              : 'SHIFT_CLOSED',
          entityType: 'SHIFT',
          entityId: id,
          description: 'Shift closed',
          metadata: {
            expectedCash: totals.expectedCash,
            closingCash: input.closingCash,
            cashDifference: closedShift.cashDifference,
          },
        },
        tx,
      );
      return {
        shiftId: closedShift.id,
        status: 'CLOSED' as const,
        expectedCash: closedShift.expectedCash,
        closingCash: closedShift.closingCash,
        cashDifference: closedShift.cashDifference,
        closedAt: closedShift.closedAt,
        closedBy: closedShift.closedBy,
      };
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
      const canCreateAny = roleHasPermission(
        actor.role,
        PERMISSIONS.cashMovementsCreateAny,
      );
      const canCreateOwn = roleHasPermission(
        actor.role,
        PERMISSIONS.cashMovementsCreateOwn,
      );
      if (
        (!canCreateAny && !canCreateOwn) ||
        (!canCreateAny && shift.userId !== actor.id)
      ) {
        throw new ForbiddenException(
          'You cannot record cash movements for this shift',
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
          amount: input.amount,
          description: input.description,
        })
        .returning();
      if (movement)
        await this.auditLogs?.record(
          {
            userId: actor.id,
            action:
              input.type === 'IN'
                ? 'CASH_MOVEMENT_IN_RECORDED'
                : 'CASH_MOVEMENT_OUT_RECORDED',
            entityType: 'CASH_MOVEMENT',
            entityId: movement.id,
            description: `Cash movement ${input.type} recorded`,
            metadata: { shiftId: shift.id, amount: input.amount },
          },
          tx,
        );
      return movement;
    });
  }
}

function parseEndDate(value: string): { date: Date; exclusive: boolean } {
  const date = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date, exclusive: false };
  date.setUTCDate(date.getUTCDate() + 1);
  return { date, exclusive: true };
}

function isUniqueViolation(error: unknown): boolean {
  const visited = new Set<object>();
  let current = error;
  while (typeof current === 'object' && current !== null) {
    if (visited.has(current)) return false;
    visited.add(current);
    if (
      'code' in current &&
      current.code === '23505' &&
      'constraint' in current &&
      current.constraint === 'shifts_one_active_per_user'
    ) {
      return true;
    }
    current = 'cause' in current ? current.cause : undefined;
  }
  return false;
}
