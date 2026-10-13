import { users } from './users.schema.js';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  refreshTokenHash: varchar('refresh_token_hash', {
    length: 255,
  })
    .notNull()
    .unique(),

  expiresAt: timestamp('expires_at', {
    withTimezone: true,
  }).notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  revokedAt: timestamp('revoked_at', {
    withTimezone: true,
  }),
});
