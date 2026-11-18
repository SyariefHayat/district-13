import {
  pgTable,
  uuid,
  text,
  bigint,
  numeric,
  timestamp,
  date,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { shifts } from './shifts.schema.js';
import { users } from './users.schema.js';
import { devices } from './devices.schema.js';
import { discounts } from './discounts.schema.js';
import { products } from './products.schema.js';
import { addons } from './addons.schema.js';
import {
  saleStatusEnum,
  taxModeEnum,
  paymentMethodEnum,
} from './enums.schema.js';

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey(),
  receiptNo: text('receipt_no').notNull().unique(),
  queueNo: text('queue_no'),
  shiftId: uuid('shift_id')
    .notNull()
    .references(() => shifts.id),
  cashierId: uuid('cashier_id')
    .notNull()
    .references(() => users.id),
  deviceId: uuid('device_id')
    .notNull()
    .references(() => devices.id),
  status: saleStatusEnum('status').default('completed').notNull(),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
  discountId: uuid('discount_id').references(() => discounts.id),
  discountName: text('discount_name'),
  discountAmount: bigint('discount_amount', { mode: 'number' })
    .default(0)
    .notNull(),
  taxMode: taxModeEnum('tax_mode').notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 })
    .default('0')
    .notNull(),
  taxAmount: bigint('tax_amount', { mode: 'number' }).default(0).notNull(),
  total: bigint('total', { mode: 'number' }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  cashReceived: bigint('cash_received', { mode: 'number' }),
  changeAmount: bigint('change_amount', { mode: 'number' }),
  createdAtClient: timestamp('created_at_client', {
    withTimezone: true,
  }).notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  businessDate: date('business_date').notNull(),
  isOffline: boolean('is_offline').default(false).notNull(),
  lateSyncFlag: boolean('late_sync_flag').default(false).notNull(),
  clockSkewFlag: boolean('clock_skew_flag').default(false).notNull(),
});

export const saleItems = pgTable('sale_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  saleId: uuid('sale_id')
    .notNull()
    .references(() => sales.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  sku: text('sku').notNull(),
  unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
  costPrice: bigint('cost_price', { mode: 'number' }).notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: bigint('line_total', { mode: 'number' }).notNull(),
  businessDate: date('business_date').notNull(),
});

export const saleItemAddons = pgTable('sale_item_addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  saleItemId: uuid('sale_item_id')
    .notNull()
    .references(() => saleItems.id, { onDelete: 'cascade' }),
  addonId: uuid('addon_id')
    .notNull()
    .references(() => addons.id),
  name: text('name').notNull(),
  price: bigint('price', { mode: 'number' }).notNull(),
});

export const saleVoids = pgTable('sale_voids', {
  id: uuid('id').defaultRandom().primaryKey(),
  saleId: uuid('sale_id')
    .notNull()
    .unique()
    .references(() => sales.id),
  reason: text('reason').notNull(),
  voidedBy: uuid('voided_by')
    .notNull()
    .references(() => users.id),
  voidedAt: timestamp('voided_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
