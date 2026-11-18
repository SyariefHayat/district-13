import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  bigint,
} from 'drizzle-orm/pg-core';

export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedSeq: bigint('updated_seq', { mode: 'number' }).notNull(),
});
