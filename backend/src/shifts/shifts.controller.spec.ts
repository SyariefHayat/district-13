import { vi } from 'vitest';

vi.mock('../drizzle/config/env.js', () => ({
  env: {
    nodeEnv: 'test',
    databaseUrl: 'postgres://test:test@localhost:5432/test',
    accessTokenSecret: 'test-only-access-token-secret-32-bytes-minimum',
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 604800,
  },
}));

import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  ANY_PERMISSIONS_KEY,
  PERMISSIONS_KEY,
} from '../auth/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import { ShiftsController } from './shifts.controller.js';

function methodMetadata(key: string, method: keyof ShiftsController) {
  const handler = Object.getOwnPropertyDescriptor(
    ShiftsController.prototype,
    method,
  )?.value;
  return Reflect.getMetadata(key, handler);
}

describe('ShiftsController authorization', () => {
  it('requires authentication and permission checks', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ShiftsController)).toEqual([
      JwtAuthGuard,
      PermissionsGuard,
    ]);
  });

  it('requires opening permission and permits only owner/admin to read all shifts', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'open')).toEqual([
      PERMISSIONS.shiftsOpen,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'list')).toEqual([
      PERMISSIONS.shiftsReadOwn,
      PERMISSIONS.shiftsReadAll,
    ]);
    expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsReadOwn)).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsReadAll)).toBe(false);
    expect(roleHasPermission('ADMIN', PERMISSIONS.shiftsReadAll)).toBe(true);
  });

  it('restricts close and movement operations to declared permissions', () => {
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'close')).toEqual([
      PERMISSIONS.shiftsCloseOwn,
      PERMISSIONS.shiftsCloseAny,
    ]);
    expect(methodMetadata(PERMISSIONS_KEY, 'createCashMovement')).toEqual([
      PERMISSIONS.cashMovementsCreate,
    ]);
  });
});
