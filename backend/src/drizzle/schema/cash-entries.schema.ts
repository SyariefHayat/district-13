import { pgTable, uuid, bigint, text, timestamp } from 'drizzle-orm/pg-core';
import { shifts } from './shifts.schema.js';
import { users } from './users.schema.js';
import { cashEntryTypeEnum } from './enums.schema.js';

export const cashEntries = pgTable('cash_entries', {
  id: uuid('id').primaryKey(),
  shiftId: uuid('shift_id')
    .notNull()
    .references(() => shifts.id),
  type: cashEntryTypeEnum('type').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  reason: text('reason'),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
