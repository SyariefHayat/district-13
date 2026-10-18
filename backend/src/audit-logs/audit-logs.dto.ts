import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
export const AUDIT_ENTITY_TYPES = [
  'USER',
  'SESSION',
  'PRODUCT',
  'CATEGORY',
  'ADDON',
  'INVENTORY',
  'TRANSACTION',
  'SHIFT',
  'CASH_MOVEMENT',
] as const;
export const AUDIT_ACTIONS = [
  'AUTH_LOGIN_SUCCEEDED',
  'AUTH_LOGIN_FAILED',
  'AUTH_LOGGED_OUT',
  'AUTH_SESSION_REVOKED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'USER_ROLE_CHANGED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_DEACTIVATED',
  'PRODUCT_AVAILABILITY_CHANGED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DEACTIVATED',
  'CATEGORY_REACTIVATED',
  'ADDON_CREATED',
  'ADDON_UPDATED',
  'ADDON_DEACTIVATED',
  'INVENTORY_STOCK_IN',
  'INVENTORY_TRANSFERRED',
  'INVENTORY_SALE_DEDUCTED',
  'INVENTORY_VOID_RETURNED',
  'TRANSACTION_CREATED',
  'TRANSACTION_VOIDED',
  'SHIFT_OPENED',
  'SHIFT_CLOSED',
  'SHIFT_CLOSED_BY_SUPERVISOR',
  'CASH_MOVEMENT_IN_RECORDED',
  'CASH_MOVEMENT_OUT_RECORDED',
] as const;
export class AuditLogsQueryDto {
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsIn(AUDIT_ACTIONS) action?: (typeof AUDIT_ACTIONS)[number];
  @IsOptional()
  @IsIn(AUDIT_ENTITY_TYPES)
  entityType?: (typeof AUDIT_ENTITY_TYPES)[number];
  @IsOptional() @IsUUID() entityId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
