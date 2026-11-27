import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  check,
} from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums.schema.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    username: text('username').notNull().unique(),

    passwordHash: text('password_hash').notNull(),

    fullName: text('full_name').default('').notNull(),

    role: userRoleEnum('role').notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    failedLoginCount: integer('failed_login_count').default(0).notNull(),

    lockedUntil: timestamp('locked_until', {
      withTimezone: true,
    }),

    lastActivityAt: timestamp('last_activity_at', {
      withTimezone: true,
    }),

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
  },
  (table) => [
    check(
      'users_username_lower_check',
      sql`${table.username} = lower(${table.username})`,
    ),
    check(
      'users_failed_login_count_check',
      sql`${table.failedLoginCount} >= 0`,
    ),
  ],
);
