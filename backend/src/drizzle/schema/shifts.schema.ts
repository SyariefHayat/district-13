import { numeric, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const cashMovementTypeEnum = pgEnum('cash_movement_type', ['IN', 'OUT']);

export const shifts = pgTable('shifts', {
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
});
