import { describe, it, expect } from 'vitest';
import { RBAC_PERMISSIONS_CATALOG } from '../src/drizzle/seed.js';
import {
  PERMISSIONS,
  roleHasPermission,
} from '../src/auth/permissions/permissions.js';

describe('RBAC Seed & Role Matrix Verification (T-16 / Issue #39)', () => {
  it('contains exactly 57 permissions catalog resolving the SRS 59 vs 57 discrepancy per Decision B-02', () => {
    expect(RBAC_PERMISSIONS_CATALOG.length).toBe(57);

    // Verify inventory.adjust is present as resolved in B-02 / B-04
    const adjustPerm = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'inventory.adjust',
    );
    expect(adjustPerm).toBeDefined();
    expect(adjustPerm?.category).toBe('Inventaris');
    expect(adjustPerm?.owner).toBe(true);
    expect(adjustPerm?.admin).toBe(true);
    expect(adjustPerm?.cashier).toBe(false);
  });

  it('strictly prohibits Owner from opening shifts and making sales (REQ-F-USR-006)', () => {
    const shiftOpen = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'shift.open',
    );
    const saleCreate = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'sale.create',
    );

    expect(shiftOpen?.owner).toBe(false);
    expect(saleCreate?.owner).toBe(false);

    expect(roleHasPermission('OWNER', PERMISSIONS.shiftsOpen)).toBe(false);
    expect(roleHasPermission('OWNER', PERMISSIONS.transactionsCreate)).toBe(
      false,
    );
    expect(roleHasPermission('owner', PERMISSIONS.shiftsOpen)).toBe(false);
    expect(roleHasPermission('owner', PERMISSIONS.transactionsCreate)).toBe(
      false,
    );
  });

  it('validates Cashier permissions contain only 14 designated operations', () => {
    const cashierPerms = RBAC_PERMISSIONS_CATALOG.filter((p) => p.cashier);
    expect(cashierPerms.length).toBe(14);

    const cashierCodes = cashierPerms.map((p) => p.code).sort();
    expect(cashierCodes).toEqual(
      [
        'addon.view',
        'cash.record_own',
        'category.view',
        'discount.view',
        'product.view',
        'report.dashboard',
        'sale.create',
        'sale.view_own',
        'sale.void',
        'schedule.view_own',
        'settings.view',
        'shift.close_own',
        'shift.open',
        'shift.view_own',
      ].sort(),
    );
  });

  it('validates cell-by-cell mapping across all 10 modules for Owner, Admin, and Cashier', () => {
    // 1. Pengguna (7 permissions)
    const userList = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'user.list',
    )!;
    expect(userList).toMatchObject({
      owner: true,
      admin: true,
      cashier: false,
    });

    const userCreate = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'user.create',
    )!;
    expect(userCreate).toMatchObject({
      owner: true,
      admin: true,
      cashier: false,
    });

    const userPwdSelf = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'user.password.change_self',
    )!;
    expect(userPwdSelf).toMatchObject({
      owner: true,
      admin: true,
      cashier: false,
    });

    const userAdminUpdate = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'user.admin.update',
    )!;
    expect(userAdminUpdate).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });

    const userCashierUpdate = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'user.cashier.update',
    )!;
    expect(userCashierUpdate).toMatchObject({
      owner: true,
      admin: true,
      cashier: false,
    });

    const userCashierReset = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'user.cashier.reset_credential',
    )!;
    expect(userCashierReset).toMatchObject({
      owner: true,
      admin: true,
      cashier: false,
    });

    const userDelete = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'user.delete',
    )!;
    expect(userDelete).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });

    // 2. Produk (12 permissions)
    const prdPriceUpdate = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'product.price.update',
    )!;
    expect(prdPriceUpdate).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });

    const addonPriceUpdate = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'addon.price.update',
    )!;
    expect(addonPriceUpdate).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });

    // 3. Inventaris (5 permissions)
    const restock = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'inventory.restock',
    )!;
    expect(restock).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });

    // 4. Shift & Kas
    const closeAny = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'shift.close_any',
    )!;
    expect(closeAny).toMatchObject({
      owner: true,
      admin: true,
      cashier: false,
    });

    const cashRecordAny = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'cash.record_any',
    )!;
    expect(cashRecordAny).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });

    // 5. Penjualan & Void
    const saleVoid = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'sale.void',
    )!;
    expect(saleVoid).toMatchObject({
      owner: false,
      admin: false,
      cashier: true,
    });

    // 6. Audit & Pengaturan
    const auditFull = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'audit.read_full',
    )!;
    expect(auditFull).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });

    const auditOp = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'audit.read_operational',
    )!;
    expect(auditOp).toMatchObject({ owner: true, admin: true, cashier: false });

    const settingsUpdate = RBAC_PERMISSIONS_CATALOG.find(
      (p) => p.code === 'settings.update',
    )!;
    expect(settingsUpdate).toMatchObject({
      owner: true,
      admin: false,
      cashier: false,
    });
  });
});
