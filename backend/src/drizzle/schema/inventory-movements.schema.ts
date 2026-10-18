import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';
import { users } from './users.schema.js';
import { transactions } from './transactions.schema.js';
import {
  inventoryLocationEnum,
  inventoryMovementTypeEnum,
} from './inventories.schema.js';

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  fromLocation: inventoryLocationEnum('from_location'),
  toLocation: inventoryLocationEnum('to_location'),
  type: inventoryMovementTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
