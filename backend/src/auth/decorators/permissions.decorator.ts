import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions/permissions.js';

export const PERMISSIONS_KEY = 'auth:permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
