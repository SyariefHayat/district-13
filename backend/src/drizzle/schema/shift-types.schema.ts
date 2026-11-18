import { pgTable, varchar, time, integer } from 'drizzle-orm/pg-core';

export const shiftTypes = pgTable('shift_types', {
  code: varchar('code', { length: 2 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  startTime: time('start_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
});
