import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const discounts = pgTable(
  'discounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    type: varchar('type', { length: 20 }).notNull().default('percentage'),
    applyMode: varchar('apply_mode', { length: 20 })
      .notNull()
      .default('automatic'), // 'automatic' (sistem auto apply saat syarat terpenuhi) | 'manual' (dipilih kasir di POS)
    value: numeric('value', { precision: 10, scale: 2 }).notNull(),
    minPurchase: numeric('min_purchase', { precision: 10, scale: 2 }).default(
      '0',
    ),
    maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    usageCount: numeric('usage_count', { precision: 10, scale: 0 })
      .default('0')
      .notNull(),
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'discounts_name_valid',
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 100`,
    ),
    check(
      'discounts_code_valid',
      sql`char_length(btrim(${table.code})) BETWEEN 1 AND 50`,
    ),
    check(
      'discounts_type_valid',
      sql`${table.type} IN ('percentage', 'fixed')`,
    ),
    check(
      'discounts_apply_mode_valid',
      sql`${table.applyMode} IN ('automatic', 'manual')`,
    ),
    check('discounts_value_nonnegative', sql`${table.value} >= 0`),
    uniqueIndex('discounts_code_normalized_unique').on(
      sql`upper(btrim(${table.code}))`,
    ),
  ],
);
