import { numeric, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { shifts } from './shifts.schema.js';
import { users } from './users.schema.js';

export const transactionPaymentMethodEnum = pgEnum(
  'transaction_payment_method',
  ['CASH', 'QRIS'],
);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'VALID',
  'VOID',
]);

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  shiftId: uuid('shift_id')
    .notNull()
    .references(() => shifts.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  paymentMethod: transactionPaymentMethodEnum('payment_method').notNull(),
  // Amount is the final sale amount after change and discounts, so it is the cash
  // retained in the drawer for a cash sale.
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: transactionStatusEnum('status').default('VALID').notNull(),
  voidedBy: uuid('voided_by').references(() => users.id),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  cashRefund: numeric('cash_refund', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
