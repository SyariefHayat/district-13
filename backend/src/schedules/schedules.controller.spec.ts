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

import {
  ANY_PERMISSIONS_KEY,
  PERMISSIONS_KEY,
} from '../auth/decorators/permissions.decorator.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../auth/permissions/permissions.js';
import { SchedulesController } from './schedules.controller.js';

function methodMetadata(key: string, method: keyof SchedulesController) {
  const handler = Object.getOwnPropertyDescriptor(
    SchedulesController.prototype,
    method,
  )?.value;
  return Reflect.getMetadata(key, handler);
}

describe('SchedulesController authorization', () => {
  it('requires management permission for create, update, delete', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'create')).toEqual([
      PERMISSIONS.schedulesManage,
    ]);
    expect(methodMetadata(PERMISSIONS_KEY, 'update')).toEqual([
      PERMISSIONS.schedulesManage,
    ]);
    expect(methodMetadata(PERMISSIONS_KEY, 'remove')).toEqual([
      PERMISSIONS.schedulesManage,
    ]);
    expect(methodMetadata(PERMISSIONS_KEY, 'removeMultiple')).toEqual([
      PERMISSIONS.schedulesManage,
    ]);
    expect(roleHasPermission('OWNER', PERMISSIONS.schedulesManage)).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.schedulesManage)).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.schedulesManage)).toBe(
      false,
    );
  });

  it('permits read access with schedulesReadAll or schedulesReadOwn', () => {
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'findAll')).toEqual([
      PERMISSIONS.schedulesReadAll,
      PERMISSIONS.schedulesReadOwn,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'findOne')).toEqual([
      PERMISSIONS.schedulesReadAll,
      PERMISSIONS.schedulesReadOwn,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'updateStatus')).toEqual([
      PERMISSIONS.schedulesManage,
      PERMISSIONS.schedulesReadOwn,
    ]);
    expect(roleHasPermission('CASHIER', PERMISSIONS.schedulesReadOwn)).toBe(
      true,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.schedulesReadAll)).toBe(
      false,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.schedulesReadAll)).toBe(true);
    expect(roleHasPermission('OWNER', PERMISSIONS.schedulesReadAll)).toBe(true);
  });
});
