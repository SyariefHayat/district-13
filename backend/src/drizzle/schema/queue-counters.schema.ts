import { pgTable, uuid, date, integer, primaryKey } from 'drizzle-orm/pg-core';
import { devices } from './devices.schema.js';

export const queueCounters = pgTable(
  'queue_counters',
  {
    deviceId: uuid('device_id')
      .notNull()
      .references(() => devices.id),
    businessDate: date('business_date').notNull(),
    lastNo: integer('last_no').default(0).notNull(),
    queueEpoch: integer('queue_epoch').default(0).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.deviceId, table.businessDate],
    }),
  ],
);
