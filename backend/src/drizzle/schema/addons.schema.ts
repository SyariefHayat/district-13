import { boolean, numeric, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const addons = pgTable('addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});
