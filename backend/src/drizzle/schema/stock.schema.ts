import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  bigint,
} from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';

export const stock = pgTable('stock', {
  productId: uuid('product_id')
    .primaryKey()
    .references(() => products.id),
  warehouseQty: integer('warehouse_qty').default(0).notNull(),
  displayQty: integer('display_qty').default(0).notNull(),
  needsReview: boolean('needs_review').default(false).notNull(),
  version: integer('version').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedSeq: bigint('updated_seq', { mode: 'number' })
    .default(sql`nextval('master_updated_seq')`)
    .notNull(),
});
