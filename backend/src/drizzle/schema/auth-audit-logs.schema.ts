import { users } from './users.schema.js';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const authAuditLogs = pgTable('auth_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  event: varchar('event', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
