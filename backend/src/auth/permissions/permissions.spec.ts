import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasPermission,
} from './permissions.js';

describe('role permission mapping', () => {
  it('keeps cashier-only sales and shift-opening permissions away from owner/admin', () => {
    for (const role of ['OWNER', 'ADMIN'] as const) {
      expect(roleHasPermission(role, PERMISSIONS.transactionsCreate)).toBe(
        false,
      );
      expect(roleHasPermission(role, PERMISSIONS.shiftsOpen)).toBe(false);
    }
    expect(roleHasPermission('CASHIER', PERMISSIONS.transactionsCreate)).toBe(
      true,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.shiftsOpen)).toBe(true);
  });

  it('limits admin permissions to the operational mapping', () => {
    expect(roleHasPermission('ADMIN', PERMISSIONS.usersRead)).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.usersUpdateOwnPassword)).toBe(
      true,
    );
    expect(
      roleHasPermission('ADMIN', PERMISSIONS.usersUpdateCashierCredentials),
    ).toBe(true);
    expect(
      roleHasPermission('ADMIN', PERMISSIONS.inventoryTransferToDisplay),
    ).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.inventoryRestock)).toBe(
      false,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsSalesRead)).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsInventoryRead)).toBe(
      true,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsCashRead)).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.productsUpdatePrices)).toBe(
      false,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.auditLogsRead)).toBe(false);
  });

  it('matches the complete admin and cashier permission lists', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toEqual([
      PERMISSIONS.usersRead,
      PERMISSIONS.usersUpdateOwnPassword,
      PERMISSIONS.usersUpdateCashierCredentials,
      PERMISSIONS.productsRead,
      PERMISSIONS.productsCreate,
      PERMISSIONS.productsUpdateDetails,
      PERMISSIONS.productsUpdateAvailability,
      PERMISSIONS.productsDeactivate,
      PERMISSIONS.categoriesRead,
      PERMISSIONS.brandsManage,
      PERMISSIONS.categoriesManage,
      PERMISSIONS.addonsRead,
      PERMISSIONS.addonsManage,
      PERMISSIONS.inventoryReadDashboard,
      PERMISSIONS.inventoryReadMovements,
      PERMISSIONS.inventoryTransferToDisplay,
      PERMISSIONS.schedulesManage,
      PERMISSIONS.schedulesReadAll,
      PERMISSIONS.shiftsReadAll,
      PERMISSIONS.shiftsCloseAny,
      PERMISSIONS.cashMovementsCreateAny,
      PERMISSIONS.transactionsVoid,
      PERMISSIONS.transactionsReadAll,
      PERMISSIONS.reportsSalesRead,
      PERMISSIONS.reportsInventoryRead,
      PERMISSIONS.reportsCashRead,
      PERMISSIONS.reportsShiftsRead,
      PERMISSIONS.reportsCashMovementsRead,
      PERMISSIONS.reportsCashierPerformanceRead,
      PERMISSIONS.auditLogsReadOperational,
      PERMISSIONS.storeSettingsRead,
      PERMISSIONS.storeSettingsUpdate,
    ]);
    expect(ROLE_PERMISSIONS.CASHIER).toEqual([
      PERMISSIONS.productsRead,
      PERMISSIONS.productsUpdateAvailability,
      PERMISSIONS.categoriesRead,
      PERMISSIONS.addonsRead,
      PERMISSIONS.schedulesReadOwn,
      PERMISSIONS.shiftsOpen,
      PERMISSIONS.shiftsReadOwn,
      PERMISSIONS.shiftsCloseOwn,
      PERMISSIONS.cashMovementsCreateOwn,
      PERMISSIONS.transactionsCreate,
      PERMISSIONS.transactionsReadOwn,
      PERMISSIONS.storeSettingsRead,
    ]);
  });

  it('grants owner all registered permissions except cashier-only actions', () => {
    const cashierOnly = [
      PERMISSIONS.transactionsCreate,
      PERMISSIONS.shiftsOpen,
    ];
    for (const permission of Object.values(PERMISSIONS)) {
      expect(roleHasPermission('OWNER', permission)).toBe(
        !cashierOnly.includes(permission),
      );
    }
    expect(ROLE_PERMISSIONS.OWNER).toContain(PERMISSIONS.transactionsVoid);
  });

  it('denies roles that are not registered', () => {
    expect(
      roleHasPermission('UNKNOWN' as never, PERMISSIONS.productsRead),
    ).toBe(false);
  });
});
