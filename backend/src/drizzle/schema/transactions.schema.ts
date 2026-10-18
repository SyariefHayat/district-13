import { sql } from 'drizzle-orm';
import {
  check,
  char,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  date,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { shifts } from './shifts.schema.js';
import { users } from './users.schema.js';
import { products } from './products.schema.js';
import { addons } from './addons.schema.js';

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
    transactionNumber: varchar('transaction_number', { length: 30 })
      .notNull()
      .unique(),
    shiftId: uuid('shift_id')
      .notNull()
      .references(() => shifts.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    subtotalAmount: numeric('subtotal_amount', {
      precision: 10,
      scale: 2,
    }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    discountReason: varchar('discount_reason', { length: 255 }),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: transactionPaymentMethodEnum('payment_method').notNull(),
    paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull(),
    changeAmount: numeric('change_amount', {
      precision: 10,
      scale: 2,
    }).notNull(),
    status: transactionStatusEnum('status').notNull(),
    voidedBy: uuid('voided_by').references(() => users.id),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: varchar('void_reason', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'transactions_amounts_nonnegative',
      sql`${table.subtotalAmount} >= 0 AND ${table.discountAmount} >= 0 AND ${table.totalAmount} >= 0 AND ${table.paidAmount} >= 0 AND ${table.changeAmount} >= 0`,
    ),
    check(
      'transactions_discount_lte_subtotal',
      sql`${table.discountAmount} <= ${table.subtotalAmount}`,
    ),
    check(
      'transactions_total_consistent',
      sql`${table.totalAmount} = ${table.subtotalAmount} - ${table.discountAmount}`,
    ),
    check(
      'transactions_payment_consistent',
      sql`(${table.paymentMethod} = 'CASH' AND ${table.paidAmount} >= ${table.totalAmount} AND ${table.changeAmount} = ${table.paidAmount} - ${table.totalAmount}) OR (${table.paymentMethod} = 'QRIS' AND ${table.paidAmount} = ${table.totalAmount} AND ${table.changeAmount} = 0)`,
    ),
    index('transactions_shift_completed_cash_idx')
      .on(table.shiftId)
      .where(
        sql`${table.status} = 'COMPLETED' AND ${table.paymentMethod} = 'CASH'`,
      ),
  ],
);

export const transactionItems = pgTable(
  'transaction_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    productName: varchar('product_name', { length: 120 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    subtotalAmount: numeric('subtotal_amount', {
      precision: 10,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    check('transaction_items_quantity_positive', sql`${table.quantity} > 0`),
    check(
      'transaction_items_amounts_nonnegative',
      sql`${table.unitPrice} >= 0 AND ${table.subtotalAmount} >= 0`,
    ),
    index('transaction_items_transaction_idx').on(table.transactionId),
  ],
);

export const transactionItemAddons = pgTable(
  'transaction_item_addons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionItemId: uuid('transaction_item_id')
      .notNull()
      .references(() => transactionItems.id),
    addonId: uuid('addon_id')
      .notNull()
      .references(() => addons.id),
    addonName: varchar('addon_name', { length: 100 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
  },
  (table) => [
    check(
      'transaction_item_addons_quantity_positive',
      sql`${table.quantity} > 0`,
    ),
    check(
      'transaction_item_addons_price_nonnegative',
      sql`${table.unitPrice} >= 0`,
    ),
  ],
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    scope: varchar('scope', { length: 50 }).notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    requestHash: char('request_hash', { length: 64 }).notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    resourceId: uuid('resource_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    unique().on(table.userId, table.scope, table.key),
    index('idempotency_keys_expires_at_idx').on(table.expiresAt),
  ],
);

export const transactionCounters = pgTable(
  'transaction_counters',
  {
    businessDate: date('business_date').primaryKey(),
    lastValue: integer('last_value').notNull(),
  },
  (table) => [
    check(
      'transaction_counters_last_value_positive',
      sql`${table.lastValue} > 0`,
    ),
  ],
);

export const transactionAuditLogs = pgTable('transaction_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  event: varchar('event', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
