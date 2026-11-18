import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums.schema.js';

export const permissions = pgTable('permissions', {
  code: text('code').primaryKey(),
  description: text('description').notNull(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    role: userRoleEnum('role').notNull(),
    permissionCode: text('permission_code')
      .notNull()
      .references(() => permissions.code, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.role, table.permissionCode],
    }),
  ],
);
