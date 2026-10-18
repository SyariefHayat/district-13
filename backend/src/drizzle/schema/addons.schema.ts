import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  numeric,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const addons = pgTable(
  'addons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    check(
      'addons_name_valid',
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 100`,
    ),
    check('addons_price_nonnegative', sql`${table.price} >= 0`),
  ],
);
