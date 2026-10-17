import { sql } from 'drizzle-orm';
import {
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const cashMovementTypeEnum = pgEnum('cash_movement_type', ['IN', 'OUT']);

export const shifts = pgTable(
  'shifts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    openingCash: numeric('opening_cash', { precision: 10, scale: 2 }).notNull(),
    expectedCash: numeric('expected_cash', { precision: 10, scale: 2 }),
    closingCash: numeric('closing_cash', { precision: 10, scale: 2 }),
    cashDifference: numeric('cash_difference', { precision: 10, scale: 2 }),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedBy: uuid('closed_by').references(() => users.id),
  },
  (table) => [
    uniqueIndex('shifts_one_active_per_user')
      .on(table.userId)
      .where(sql`${table.closedAt} IS NULL`),
    index('shifts_opened_at_idx').on(table.openedAt),
  ],
);
