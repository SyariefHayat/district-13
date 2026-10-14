import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions/permissions.js';

export const PERMISSIONS_KEY = 'auth:permissions';
export const ANY_PERMISSIONS_KEY = 'auth:any-permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
export const AnyPermissions = (...permissions: Permission[]) =>
  SetMetadata(ANY_PERMISSIONS_KEY, permissions);
