import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions/permissions.js';
import {
  PERMISSIONS_KEY,
  ANY_PERMISSIONS_KEY,
} from './permissions.decorator.js';

export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireAnyPermissions = (...permissions: Permission[]) =>
  SetMetadata(ANY_PERMISSIONS_KEY, permissions);
