import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const scheduleShiftTypeEnum = pgEnum('schedule_shift_type', [
  'MORNING',
  'AFTERNOON',
  'NIGHT',
  'FULLDAY',
]);

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'SCHEDULED',
  'ON_DUTY',
  'COMPLETED',
  'CANCELLED',
]);

export const schedules = pgTable(
  'schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    shiftType: scheduleShiftTypeEnum('shift_type').notNull(),
    shiftName: varchar('shift_name', { length: 100 }).notNull(),
    date: varchar('date', { length: 10 }).notNull(),
    startTime: varchar('start_time', { length: 10 }).notNull(),
    endTime: varchar('end_time', { length: 10 }).notNull(),
    status: scheduleStatusEnum('status').default('SCHEDULED').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('schedules_date_idx').on(table.date),
    index('schedules_user_id_idx').on(table.userId),
    index('schedules_status_idx').on(table.status),
  ],
);
