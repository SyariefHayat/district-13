import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  jsonb,
  uuid,
  timestamp,
  bigint,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const storeSettings = pgTable('store_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedSeq: bigint('updated_seq', { mode: 'number' })
    .default(sql`nextval('master_updated_seq')`)
    .notNull(),
});
