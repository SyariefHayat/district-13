import {
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { cashMovementTypeEnum, shifts } from './shifts.schema.js';
import { users } from './users.schema.js';

export const cashMovements = pgTable('cash_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  shiftId: uuid('shift_id')
    .notNull()
    .references(() => shifts.id),
  recordedBy: uuid('recorded_by')
    .notNull()
    .references(() => users.id),
  type: cashMovementTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: varchar('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
