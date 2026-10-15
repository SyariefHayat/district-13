import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  numeric,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { categories } from './categories.schema.js';

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
  },
  (table) => [
    check(
      'products_name_valid',
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 120`,
    ),
    check('products_price_nonnegative', sql`${table.price} >= 0`),
  ],
);
