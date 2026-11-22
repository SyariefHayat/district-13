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
import { ShiftTypesController } from './shift-types.controller.js';

function methodMetadata(key: string, method: keyof SchedulesController) {
  const handler = Object.getOwnPropertyDescriptor(
    SchedulesController.prototype,
    method,
  )?.value;
  return Reflect.getMetadata(key, handler);
}

function shiftTypesMethodMetadata(
  key: string,
  method: keyof ShiftTypesController,
) {
  const handler = Object.getOwnPropertyDescriptor(
    ShiftTypesController.prototype,
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
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'findMySchedules')).toEqual([
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

  describe('ShiftTypesController', () => {
    it('permits read access to shift-types for both management and cashiers', () => {
      expect(shiftTypesMethodMetadata(ANY_PERMISSIONS_KEY, 'findAll')).toEqual([
        PERMISSIONS.schedulesReadAll,
        PERMISSIONS.schedulesReadOwn,
      ]);
    });

    it('returns the 3 patent shifts with Shift 3 Malam crossing midnight (REQ: SCH-004, SCH-005)', async () => {
      const mockDb: any = {
        db: {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        },
      };
      const controller = new ShiftTypesController(mockDb);
      const types = await controller.findAll();

      expect(types).toHaveLength(3);
      expect(types[0].code).toBe('S1');
      expect(types[0].name).toBe('Shift 1 Pagi');
      expect(types[0].crossesMidnight).toBe(false);

      expect(types[1].code).toBe('S2');
      expect(types[1].name).toBe('Shift 2 Sore');
      expect(types[1].crossesMidnight).toBe(false);

      expect(types[2].code).toBe('S3');
      expect(types[2].name).toBe('Shift 3 Malam');
      expect(types[2].startTime).toBe('23:00:00');
      expect(types[2].endTime).toBe('08:00:00');
      expect(types[2].crossesMidnight).toBe(true);
    });
  });
});
