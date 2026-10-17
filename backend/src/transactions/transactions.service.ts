import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import {
  cashMovements,
  shifts,
  transactions,
} from '../drizzle/schema/index.js';
import type { CreateTransactionDto } from './dto/create-transaction.dto.js';
import type { VoidTransactionDto } from './dto/void-transaction.dto.js';

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

      // Locking the same shift row as close() makes transaction creation and
      // closing serialize, so a sale cannot commit to a shift after it closes.
      const [transaction] = await tx
        .insert(transactions)
        .values({
          shiftId: shift.id,
          userId: actor.id,
          paymentMethod: input.paymentMethod,
          amount: input.amount.toFixed(2),
          createdAt: new Date(),
        })
        .returning();
      if (!transaction)
        throw new ConflictException('Transaction could not be created');
      return transaction;
    });
  }

  async void(id: string, input: VoidTransactionDto, actor: AuthenticatedUser) {
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
      if (!transaction || transaction.status !== 'VALID') {
        throw new ConflictException('Transaction is already voided');
      }

      const refund = input.cashRefund ?? 0;
      if (toCents(refund) > toCents(transaction.amount)) {
        throw new BadRequestException(
          'Cash refund cannot exceed the sale amount',
        );
      }
      if (transaction.paymentMethod === 'QRIS' && refund > 0) {
        throw new BadRequestException(
          'QRIS transactions cannot be refunded from the cash drawer',
        );
      }

      if (transaction.paymentMethod === 'CASH') {
        // The void removes the original sale from valid cash sales. These two
        // movements preserve the actual cash retained and any cash refunded.
        await tx.insert(cashMovements).values({
          shiftId: shift.id,
          recordedBy: actor.id,
          recordedByEstimated: false,
          type: 'IN',
          amount: transaction.amount,
          description: `Void adjustment for transaction ${id}`,
          createdAt: new Date(),
        });
        if (refund > 0) {
          await tx.insert(cashMovements).values({
            shiftId: shift.id,
            recordedBy: actor.id,
            recordedByEstimated: false,
            type: 'OUT',
            amount: refund.toFixed(2),
            description: `Cash refund for transaction ${id}`,
            createdAt: new Date(),
          });
        }
      }

      const [voided] = await tx
        .update(transactions)
        .set({
          status: 'VOID',
          voidedBy: actor.id,
          voidedAt: new Date(),
          cashRefund: refund.toFixed(2),
        })
        .where(and(eq(transactions.id, id), eq(transactions.status, 'VALID')))
        .returning();
      if (!voided) throw new ConflictException('Transaction is already voided');
      return voided;
    });
  }
}

function toCents(amount: number | string): number {
  const [units, fraction = ''] = String(amount).split('.');
  return Number(units) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}
