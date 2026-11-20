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
import { ShiftsController } from './shifts.controller.js';
import { CashEntriesController } from './cash-entries.controller.js';

function methodMetadata(key: string, method: keyof ShiftsController) {
  const handler = Object.getOwnPropertyDescriptor(
    ShiftsController.prototype,
    method,
  )?.value;
  return Reflect.getMetadata(key, handler);
}

function cashEntriesMethodMetadata(
  key: string,
  method: keyof CashEntriesController,
) {
  const handler = Object.getOwnPropertyDescriptor(
    CashEntriesController.prototype,
    method,
  )?.value;
  return Reflect.getMetadata(key, handler);
}

describe('ShiftsController authorization', () => {
  it('requires opening permission and permits only owner/admin to read all shifts', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'open')).toEqual([
      PERMISSIONS.shiftsOpen,
    ]);
    expect(methodMetadata(PERMISSIONS_KEY, 'create')).toEqual([
      PERMISSIONS.shiftsOpen,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'list')).toEqual([
      PERMISSIONS.shiftsReadOwn,
      PERMISSIONS.shiftsReadAll,
    ]);
    expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsReadOwn)).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsReadAll)).toBe(false);
    expect(roleHasPermission('ADMIN', PERMISSIONS.shiftsReadAll)).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsOpen)).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.shiftsOpen)).toBe(false);
    expect(roleHasPermission('OWNER', PERMISSIONS.shiftsOpen)).toBe(false);
  });

  it('restricts close and movement operations to declared permissions', () => {
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'close')).toEqual([
      PERMISSIONS.shiftsCloseOwn,
      PERMISSIONS.shiftsCloseAny,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'createCashMovement')).toEqual([
      PERMISSIONS.cashMovementsCreateOwn,
      PERMISSIONS.cashMovementsCreateAny,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'createCashEntry')).toEqual([
      PERMISSIONS.cashMovementsCreateOwn,
      PERMISSIONS.cashMovementsCreateAny,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'getSummary')).toEqual([
      PERMISSIONS.shiftsReadOwn,
      PERMISSIONS.shiftsReadAll,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'getCashEntries')).toEqual([
      PERMISSIONS.shiftsReadOwn,
      PERMISSIONS.shiftsReadAll,
    ]);
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'getClosingPreview')).toEqual([
      PERMISSIONS.shiftsCloseOwn,
      PERMISSIONS.shiftsCloseAny,
      PERMISSIONS.shiftsReadOwn,
      PERMISSIONS.shiftsReadAll,
    ]);
  });

  it('restricts cash entries update and delete to Owner only', () => {
    expect(cashEntriesMethodMetadata(PERMISSIONS_KEY, 'update')).toEqual([
      PERMISSIONS.cashMovementsUpdate,
    ]);
    expect(cashEntriesMethodMetadata(PERMISSIONS_KEY, 'delete')).toEqual([
      PERMISSIONS.cashMovementsDelete,
    ]);
    expect(roleHasPermission('OWNER', PERMISSIONS.cashMovementsUpdate)).toBe(
      true,
    );
    expect(roleHasPermission('OWNER', PERMISSIONS.cashMovementsDelete)).toBe(
      true,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.cashMovementsUpdate)).toBe(
      false,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.cashMovementsDelete)).toBe(
      false,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.cashMovementsUpdate)).toBe(
      false,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.cashMovementsDelete)).toBe(
      false,
    );
  });
});
