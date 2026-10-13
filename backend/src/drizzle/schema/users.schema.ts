import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['OWNER', 'ADMIN', 'CASHIER']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  username: varchar('username', {
    length: 60,
  })
    .notNull()
    .unique(),

  passwordHash: varchar('password_hash', {
    length: 255,
  }).notNull(),

  role: userRoleEnum('role').notNull(),

  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
