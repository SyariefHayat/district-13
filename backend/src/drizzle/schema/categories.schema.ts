import { boolean, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});
