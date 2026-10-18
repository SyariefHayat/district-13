import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    check(
      'categories_name_valid',
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 100`,
    ),
    uniqueIndex('categories_name_normalized_unique').on(
      sql`lower(btrim(${table.name}))`,
    ),
  ],
);
