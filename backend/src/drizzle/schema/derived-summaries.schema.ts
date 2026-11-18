import {
  pgTable,
  date,
  bigint,
  integer,
  jsonb,
  timestamp,
  uuid,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';
import { users } from './users.schema.js';

export const dailySalesSummary = pgTable('daily_sales_summary', {
  businessDate: date('business_date').primaryKey(),
  revenue: bigint('revenue', { mode: 'number' }).default(0).notNull(),
  transactionCount: integer('transaction_count').default(0).notNull(),
  discountTotal: bigint('discount_total', { mode: 'number' })
    .default(0)
    .notNull(),
  taxTotal: bigint('tax_total', { mode: 'number' }).default(0).notNull(),
  paymentBreakdown: jsonb('payment_breakdown').default({}).notNull(),
  computedAt: timestamp('computed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dailyProductSummary = pgTable(
  'daily_product_summary',
  {
    businessDate: date('business_date').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').default(0).notNull(),
    revenue: bigint('revenue', { mode: 'number' }).default(0).notNull(),
    cost: bigint('cost', { mode: 'number' }).default(0).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.businessDate, table.productId],
    }),
  ],
);

export const dailyCashierSummary = pgTable(
  'daily_cashier_summary',
  {
    businessDate: date('business_date').notNull(),
    cashierId: uuid('cashier_id')
      .notNull()
      .references(() => users.id),
    transactionCount: integer('transaction_count').default(0).notNull(),
    salesTotal: bigint('sales_total', { mode: 'number' }).default(0).notNull(),
    discountTotal: bigint('discount_total', { mode: 'number' })
      .default(0)
      .notNull(),
    voidCount: integer('void_count').default(0).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.businessDate, table.cashierId],
    }),
  ],
);

export const dirtyDays = pgTable('dirty_days', {
  businessDate: date('business_date').primaryKey(),
  markedAt: timestamp('marked_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
