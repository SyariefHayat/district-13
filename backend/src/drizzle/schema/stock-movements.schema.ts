import {
  pgTable,
  bigint,
  uuid,
  integer,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';
import { users } from './users.schema.js';
import { stockMovementTypeEnum } from './enums.schema.js';

export const stockMovements = pgTable('stock_movements', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  type: stockMovementTypeEnum('type').notNull(),
  warehouseDelta: integer('warehouse_delta').default(0).notNull(),
  displayDelta: integer('display_delta').default(0).notNull(),
  refType: text('ref_type'),
  refId: uuid('ref_id'),
  reason: text('reason'),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
