import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'admin',
  'cashier',
  'OWNER',
  'ADMIN',
  'CASHIER',
]);

export const discountTypeEnum = pgEnum('discount_type', ['nominal', 'percent']);

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'sale',
  'restock',
  'transfer',
  'adjustment',
  'void',
]);

export const shiftStatusEnum = pgEnum('shift_status', ['open', 'closed']);

export const cashEntryTypeEnum = pgEnum('cash_entry_type', [
  'in',
  'out',
  'closing_withdrawal',
]);

export const saleStatusEnum = pgEnum('sale_status', ['completed', 'voided']);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'qris',
  'transfer',
]);

export const taxModeEnum = pgEnum('tax_mode', [
  'exclusive',
  'inclusive',
  'none',
]);

export const auditLevelEnum = pgEnum('audit_level', ['full', 'operational']);
