import {
  ConflictException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { shifts, transactions } from '../drizzle/schema/index.js';
import type { CreateTransactionDto } from './dto/create-transaction.dto.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly database: DatabaseService) {}

  async create(input: CreateTransactionDto, actor: AuthenticatedUser) {
    return this.database.db.transaction(async (tx) => {
      const [shift] = await tx
        .select()
        .from(shifts)
        .where(and(eq(shifts.userId, actor.id), isNull(shifts.closedAt)))
        .for('update');
      if (!shift) {
        throw new NotFoundException(
          'Open a shift before creating a transaction',
        );
      }

      const [transaction] = await tx
        .insert(transactions)
        .values({
          shiftId: shift.id,
          userId: actor.id,
          paymentMethod: input.paymentMethod,
          totalAmount: input.totalAmount,
          status: 'COMPLETED',
          createdAt: new Date(),
        })
        .returning();
      if (!transaction)
        throw new ConflictException('Transaction could not be created');
      return transaction;
    });
  }

  async void(id: string, actor: AuthenticatedUser) {
    return this.database.db.transaction(async (tx) => {
      const [initial] = await tx
        .select({ shiftId: transactions.shiftId })
        .from(transactions)
        .where(eq(transactions.id, id));
      if (!initial) throw new NotFoundException('Transaction not found');

      const [shift] = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, initial.shiftId))
        .for('update');
      if (!shift) throw new NotFoundException('Shift not found');
      if (shift.closedAt) {
        throw new ConflictException(
          'Transactions on closed shifts cannot be voided',
        );
      }

      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .for('update');
      if (!transaction || transaction.status !== 'COMPLETED') {
        throw new ConflictException('Transaction is already voided');
      }

      const [voided] = await tx
        .update(transactions)
        .set({
          status: 'VOIDED',
          voidedBy: actor.id,
          voidedAt: new Date(),
        })
        .where(
          and(eq(transactions.id, id), eq(transactions.status, 'COMPLETED')),
        )
        .returning();
      if (!voided) throw new ConflictException('Transaction is already voided');
      return voided;
    });
  }
}
