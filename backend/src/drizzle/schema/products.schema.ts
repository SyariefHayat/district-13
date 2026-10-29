import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  jsonb,
  numeric,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { categories } from './categories.schema.js';
import { subcategories } from './subcategories.schema.js';

export interface ProductVariantItem {
  id: string;
  option: string;
  value: string;
  price: number;
}

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    sku: varchar('sku', { length: 50 }),
    barcode: varchar('barcode', { length: 50 }),
    description: text('description'),
    images: jsonb('images').$type<string[]>().default([]).notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
    chargeTax: boolean('charge_tax').default(false).notNull(),
    inStock: boolean('in_stock').default(true).notNull(),
    status: varchar('status', { length: 20 }).default('published').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    subCategoryId: uuid('sub_category_id').references(() => subcategories.id, {
      onDelete: 'set null',
    }),
    variants: jsonb('variants')
      .$type<ProductVariantItem[]>()
      .default([])
      .notNull(),
  },
  (table) => [
    check(
      'products_name_valid',
      sql`char_length(btrim(${table.name})) BETWEEN 1 AND 120`,
    ),
    check('products_price_nonnegative', sql`${table.price} >= 0`),
    check(
      'products_cost_price_nonnegative',
      sql`${table.costPrice} IS NULL OR ${table.costPrice} >= 0`,
    ),
  ],
);
