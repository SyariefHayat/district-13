import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { categories } from './categories.schema.js';

export const subcategories = pgTable(
  'subcategories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    check(
      'subcategories_name_valid',
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 100`,
    ),
    uniqueIndex('subcategories_category_id_name_normalized_unique').on(
      table.categoryId,
      sql`lower(btrim(${table.name}))`,
    ),
  ],
);
