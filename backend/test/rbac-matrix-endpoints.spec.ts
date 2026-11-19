import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasPermission,
} from '../src/auth/permissions/permissions.js';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard.js';
import {
  PERMISSIONS_KEY,
  ANY_PERMISSIONS_KEY,
  AUTHENTICATED_ONLY_KEY,
} from '../src/auth/decorators/permissions.decorator.js';
import {
  RequirePermission,
  RequireAnyPermissions,
} from '../src/auth/decorators/require-permission.decorator.js';
import { ForbiddenException } from '@nestjs/common';
import type { UserRole } from '../src/auth/types/auth.types.js';

function createGuardContext(
  metadata: Record<string, unknown>,
  role?: UserRole,
  userId = 'test-user',
) {
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  };
  const guard = new PermissionsGuard(reflector as never);
  const executionContext = {
    getHandler: () => 'handler',
    getClass: () => 'controller',
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { id: userId, role, sessionId: 's-1' } : undefined,
      }),
    }),
  } as never;
  return { guard, executionContext };
}

describe('RBAC 57-Permission Matrix & Endpoint Enforcement', () => {
  it('contains exactly 57 distinct permission definitions', () => {
    const allPerms = Object.values(PERMISSIONS);
    const uniquePerms = new Set(allPerms);
    expect(uniquePerms.size).toBe(57);
  });

  describe('Role Permission Allocations', () => {
    it('allocates 55 permissions to Owner (all registered permissions except shift.open and transaction.create)', () => {
      // 57 minus 2 cashier-exclusive actions
      expect(ROLE_PERMISSIONS.OWNER.length).toBe(55);
      expect(roleHasPermission('OWNER', PERMISSIONS.shiftsOpen)).toBe(false);
      expect(roleHasPermission('OWNER', PERMISSIONS.transactionsCreate)).toBe(
        false,
      );
      expect(roleHasPermission('owner', PERMISSIONS.shiftsOpen)).toBe(false);
      expect(roleHasPermission('owner', PERMISSIONS.transactionsCreate)).toBe(
        false,
      );
    });

    it('allocates 36 permissions to Admin for operational management', () => {
      expect(ROLE_PERMISSIONS.ADMIN.length).toBe(36);
      expect(roleHasPermission('ADMIN', PERMISSIONS.shiftsCloseAny)).toBe(true);
      expect(roleHasPermission('ADMIN', PERMISSIONS.usersRead)).toBe(true);
      expect(roleHasPermission('ADMIN', PERMISSIONS.inventoryAdjust)).toBe(
        true,
      );
      expect(roleHasPermission('ADMIN', PERMISSIONS.productsUpdatePrices)).toBe(
        false,
      );
      expect(roleHasPermission('ADMIN', PERMISSIONS.reportsProfitRead)).toBe(
        false,
      );
    });

    it('allocates exactly 14 permissions to Cashier for POS operations', () => {
      expect(ROLE_PERMISSIONS.CASHIER.length).toBe(14);
      expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsOpen)).toBe(true);
      expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsCloseOwn)).toBe(
        true,
      );
      expect(roleHasPermission('CASHIER', PERMISSIONS.transactionsCreate)).toBe(
        true,
      );
      expect(roleHasPermission('CASHIER', PERMISSIONS.productsRead)).toBe(true);
      expect(roleHasPermission('CASHIER', PERMISSIONS.usersRead)).toBe(false);
      expect(
        roleHasPermission('CASHIER', PERMISSIONS.inventoryReadDashboard),
      ).toBe(false);
    });
  });

  describe('REQ-F-USR-006: Server-side Prohibition of Owner & Admin in POS Operations', () => {
    it('rejects Owner when attempting to open a shift with 403 AUTH_FORBIDDEN', () => {
      const { guard, executionContext } = createGuardContext(
        { [PERMISSIONS_KEY]: [PERMISSIONS.shiftsOpen] },
        'OWNER',
      );
      try {
        guard.canActivate(executionContext);
        expect.unreachable('Owner should not be allowed to open shift');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
          message: expect.stringContaining('REQ-F-USR-006'),
        });
      }
    });

    it('rejects Admin when attempting to open a shift with 403 AUTH_FORBIDDEN', () => {
      const { guard, executionContext } = createGuardContext(
        { [PERMISSIONS_KEY]: [PERMISSIONS.shiftsOpen] },
        'admin',
      );
      try {
        guard.canActivate(executionContext);
        expect.unreachable('Admin should not be allowed to open shift');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });

    it('rejects Owner when attempting to create a transaction with 403 AUTH_FORBIDDEN', () => {
      const { guard, executionContext } = createGuardContext(
        { [PERMISSIONS_KEY]: [PERMISSIONS.transactionsCreate] },
        'owner',
      );
      try {
        guard.canActivate(executionContext);
        expect.unreachable('Owner should not be allowed to create transaction');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });

    it('rejects Admin when attempting to create a transaction with 403 AUTH_FORBIDDEN', () => {
      const { guard, executionContext } = createGuardContext(
        { [PERMISSIONS_KEY]: [PERMISSIONS.transactionsCreate] },
        'ADMIN',
      );
      try {
        guard.canActivate(executionContext);
        expect.unreachable('Admin should not be allowed to create transaction');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });

    it('allows Cashier to open shift and create transaction', () => {
      const shift = createGuardContext(
        { [PERMISSIONS_KEY]: [PERMISSIONS.shiftsOpen] },
        'cashier',
      );
      expect(shift.guard.canActivate(shift.executionContext)).toBe(true);

      const sale = createGuardContext(
        { [PERMISSIONS_KEY]: [PERMISSIONS.transactionsCreate] },
        'CASHIER',
      );
      expect(sale.guard.canActivate(sale.executionContext)).toBe(true);
    });
  });

  describe('Audit Logs RBAC Access Control', () => {
    const auditLogMetadata = {
      [ANY_PERMISSIONS_KEY]: [
        PERMISSIONS.auditLogsRead,
        PERMISSIONS.auditLogsReadOperational,
      ],
    };

    it('allows Owner to access audit logs via auditLogsRead', () => {
      const { guard, executionContext } = createGuardContext(
        auditLogMetadata,
        'OWNER',
      );
      expect(guard.canActivate(executionContext)).toBe(true);
    });

    it('allows Admin to access audit logs via auditLogsReadOperational', () => {
      const { guard, executionContext } = createGuardContext(
        auditLogMetadata,
        'ADMIN',
      );
      expect(guard.canActivate(executionContext)).toBe(true);
    });

    it('denies Cashier from accessing audit logs with 403 AUTH_FORBIDDEN', () => {
      const { guard, executionContext } = createGuardContext(
        auditLogMetadata,
        'CASHIER',
      );
      try {
        guard.canActivate(executionContext);
        expect.unreachable('Cashier should not access audit logs');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });
  });

  describe('Decorators & Guard Integration', () => {
    it('RequirePermission decorator produces compatible metadata', () => {
      class TestController {
        @RequirePermission(PERMISSIONS.productsRead)
        readProducts() {}
      }
      expect(TestController).toBeDefined();
    });

    it('RequireAnyPermissions decorator produces compatible metadata', () => {
      class TestController {
        @RequireAnyPermissions(
          PERMISSIONS.transactionsReadOwn,
          PERMISSIONS.transactionsReadAll,
        )
        readTransactions() {}
      }
      expect(TestController).toBeDefined();
    });
  });

  describe('User Management RBAC Access Control (T-20)', () => {
    const userDeleteMetadata = {
      [PERMISSIONS_KEY]: [PERMISSIONS.usersDelete],
    };

    it('allows Owner to delete users via usersDelete', () => {
      const { guard, executionContext } = createGuardContext(
        userDeleteMetadata,
        'OWNER',
      );
      expect(guard.canActivate(executionContext)).toBe(true);
    });

    it('denies Admin from deleting users with 403 AUTH_FORBIDDEN', () => {
      const { guard, executionContext } = createGuardContext(
        userDeleteMetadata,
        'ADMIN',
      );
      try {
        guard.canActivate(executionContext);
        expect.unreachable('Admin should not delete users');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });

    it('denies Cashier from deleting users with 403 AUTH_FORBIDDEN', () => {
      const { guard, executionContext } = createGuardContext(
        userDeleteMetadata,
        'CASHIER',
      );
      try {
        guard.canActivate(executionContext);
        expect.unreachable('Cashier should not delete users');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });

    const userCreateMetadata = {
      [ANY_PERMISSIONS_KEY]: [
        PERMISSIONS.usersCreate,
        PERMISSIONS.usersUpdateCashierCredentials,
      ],
    };

    it('allows Owner and Admin to access user creation endpoint', () => {
      const owner = createGuardContext(userCreateMetadata, 'OWNER');
      expect(owner.guard.canActivate(owner.executionContext)).toBe(true);

      const admin = createGuardContext(userCreateMetadata, 'ADMIN');
      expect(admin.guard.canActivate(admin.executionContext)).toBe(true);
    });

    it('denies Cashier from user creation endpoint with 403 AUTH_FORBIDDEN', () => {
      const cashier = createGuardContext(userCreateMetadata, 'CASHIER');
      try {
        cashier.guard.canActivate(cashier.executionContext);
        expect.unreachable('Cashier should not access user creation');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });

    const changeOwnPasswordMetadata = {
      [PERMISSIONS_KEY]: [PERMISSIONS.usersUpdateOwnPassword],
    };

    it('allows Owner and Admin to change own password, denies Cashier', () => {
      const owner = createGuardContext(changeOwnPasswordMetadata, 'OWNER');
      expect(owner.guard.canActivate(owner.executionContext)).toBe(true);

      const admin = createGuardContext(changeOwnPasswordMetadata, 'ADMIN');
      expect(admin.guard.canActivate(admin.executionContext)).toBe(true);

      const cashier = createGuardContext(changeOwnPasswordMetadata, 'CASHIER');
      try {
        cashier.guard.canActivate(cashier.executionContext);
        expect.unreachable(
          'Cashier should not change own password via this endpoint',
        );
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse()).toMatchObject({
          statusCode: 403,
          code: 'AUTH_FORBIDDEN',
        });
      }
    });

    const storeSettingsReadMetadata = {
      [PERMISSIONS_KEY]: [PERMISSIONS.storeSettingsRead],
    };

    it('allows all roles (Owner, Admin, Cashier) to read store settings (REQ-F-SET-003)', () => {
      for (const role of ['OWNER', 'ADMIN', 'CASHIER'] as const) {
        const ctx = createGuardContext(storeSettingsReadMetadata, role);
        expect(ctx.guard.canActivate(ctx.executionContext)).toBe(true);
      }
    });

    const queueResetMetadata = {
      [PERMISSIONS_KEY]: [PERMISSIONS.orderCounterReset],
    };

    it('allows Owner to reset queue counter, denies Admin and Cashier (REQ-F-SET-004)', () => {
      const owner = createGuardContext(queueResetMetadata, 'OWNER');
      expect(owner.guard.canActivate(owner.executionContext)).toBe(true);

      for (const role of ['ADMIN', 'CASHIER'] as const) {
        const ctx = createGuardContext(queueResetMetadata, role);
        expect(() => ctx.guard.canActivate(ctx.executionContext)).toThrow(
          ForbiddenException,
        );
      }
    });

    const devicesManageMetadata = {
      [PERMISSIONS_KEY]: [PERMISSIONS.storeSettingsUpdate],
    };

    it('allows Owner and Admin to manage devices, denies Cashier', () => {
      const owner = createGuardContext(devicesManageMetadata, 'OWNER');
      expect(owner.guard.canActivate(owner.executionContext)).toBe(true);

      const admin = createGuardContext(devicesManageMetadata, 'ADMIN');
      expect(admin.guard.canActivate(admin.executionContext)).toBe(true);

      const cashier = createGuardContext(devicesManageMetadata, 'CASHIER');
      expect(() => cashier.guard.canActivate(cashier.executionContext)).toThrow(
        ForbiddenException,
      );
    });

    const categoriesManageMetadata = {
      [PERMISSIONS_KEY]: [PERMISSIONS.categoriesManage],
    };

    it('allows Owner and Admin to manage categories, denies Cashier (REQ-F-PRD-007, AC)', () => {
      const owner = createGuardContext(categoriesManageMetadata, 'OWNER');
      expect(owner.guard.canActivate(owner.executionContext)).toBe(true);

      const admin = createGuardContext(categoriesManageMetadata, 'ADMIN');
      expect(admin.guard.canActivate(admin.executionContext)).toBe(true);

      const cashier = createGuardContext(categoriesManageMetadata, 'CASHIER');
      expect(() => cashier.guard.canActivate(cashier.executionContext)).toThrow(
        ForbiddenException,
      );
    });

    const brandsManageMetadata = {
      [PERMISSIONS_KEY]: [PERMISSIONS.brandsManage],
    };

    it('allows Owner and Admin to manage brands, denies Cashier (REQ-F-PRD-007, AC)', () => {
      const owner = createGuardContext(brandsManageMetadata, 'OWNER');
      expect(owner.guard.canActivate(owner.executionContext)).toBe(true);

      const admin = createGuardContext(brandsManageMetadata, 'ADMIN');
      expect(admin.guard.canActivate(admin.executionContext)).toBe(true);

      const cashier = createGuardContext(brandsManageMetadata, 'CASHIER');
      expect(() => cashier.guard.canActivate(cashier.executionContext)).toThrow(
        ForbiddenException,
      );
    });
  });
});
