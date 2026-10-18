import { sql } from 'drizzle-orm';
import {
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { shifts } from './shifts.schema.js';
import { users } from './users.schema.js';

export const transactionPaymentMethodEnum = pgEnum(
  'transaction_payment_method',
  ['CASH', 'QRIS'],
);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'COMPLETED',
  'VOIDED',
]);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shiftId: uuid('shift_id')
      .notNull()
      .references(() => shifts.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    paymentMethod: transactionPaymentMethodEnum('payment_method').notNull(),
    totalAmount: numeric('total_amount', {
      precision: 10,
      scale: 2,
    }).notNull(),
    status: transactionStatusEnum('status').notNull(),
    voidedBy: uuid('voided_by').references(() => users.id),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('transactions_shift_completed_cash_idx')
      .on(table.shiftId)
      .where(
        sql`${table.status} = 'COMPLETED' AND ${table.paymentMethod} = 'CASH'`,
      ),
  ],
);
