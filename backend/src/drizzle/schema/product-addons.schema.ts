import { pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { addons } from './addons.schema.js';
import { products } from './products.schema.js';

export const productAddons = pgTable(
  'product_addons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    addonId: uuid('addon_id')
      .notNull()
      .references(() => addons.id),
  },
  (table) => [unique().on(table.productId, table.addonId)],
);
