import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const authLoginAttempts = pgTable(
  'auth_login_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    usernameKey: varchar('username_key', { length: 64 }).notNull(),
    ipKey: varchar('ip_key', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('auth_login_attempts_username_created_idx').on(
      table.usernameKey,
      table.createdAt,
    ),
    index('auth_login_attempts_ip_created_idx').on(
      table.ipKey,
      table.createdAt,
    ),
  ],
);
