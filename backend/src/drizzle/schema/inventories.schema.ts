import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';

export const inventoryLocationEnum = pgEnum('inventory_location', [
  'WAREHOUSE',
  'DISPLAY',
]);

export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'STOCK_IN',
  'TRANSFER',
  'SALE',
  'VOID_RETURN',
]);

export const inventories = pgTable(
  'inventories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    location: inventoryLocationEnum('location').notNull(),
    stock: integer('stock').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique().on(table.productId, table.location)],
);
