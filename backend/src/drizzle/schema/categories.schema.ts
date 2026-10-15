import { sql } from 'drizzle-orm';
import { boolean, check, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    check(
      'categories_name_valid',
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 100`,
    ),
  ],
);
