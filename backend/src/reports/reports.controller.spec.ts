import { vi, describe, it, expect } from 'vitest';

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
import { ReportsController } from './reports.controller.js';
import type { ProfitQueryDto } from './dto/profit-query.dto.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

function methodMetadata(key: string, method: keyof ReportsController) {
  const handler = Object.getOwnPropertyDescriptor(
    ReportsController.prototype,
    method,
  )?.value;
  return Reflect.getMetadata(key, handler);
}

describe('ReportsController authorization', () => {
  it('protects profit analytics endpoint strictly for Owner (T-54)', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'profit')).toEqual([
      PERMISSIONS.reportsProfitRead,
    ]);

    expect(roleHasPermission('OWNER', PERMISSIONS.reportsProfitRead)).toBe(
      true,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsProfitRead)).toBe(
      false,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsProfitRead)).toBe(
      false,
    );
  });

  it('protects discounts report endpoint strictly for Owner (T-54)', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'discounts')).toEqual([
      PERMISSIONS.reportsDiscountsRead,
    ]);

    expect(roleHasPermission('OWNER', PERMISSIONS.reportsDiscountsRead)).toBe(
      true,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsDiscountsRead)).toBe(
      false,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsDiscountsRead)).toBe(
      false,
    );
  });

  it('protects payment methods report endpoint strictly for Owner (T-54)', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'paymentMethods')).toEqual([
      PERMISSIONS.reportsPaymentMethodsRead,
    ]);

    expect(
      roleHasPermission('OWNER', PERMISSIONS.reportsPaymentMethodsRead),
    ).toBe(true);
    expect(
      roleHasPermission('ADMIN', PERMISSIONS.reportsPaymentMethodsRead),
    ).toBe(false);
    expect(
      roleHasPermission('CASHIER', PERMISSIONS.reportsPaymentMethodsRead),
    ).toBe(false);
  });

  it('protects reconciliation report endpoint for Owner and Admin (T-54)', () => {
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'reconciliation')).toEqual([
      PERMISSIONS.reportsSalesRead,
      PERMISSIONS.reportsProfitRead,
    ]);

    expect(roleHasPermission('OWNER', PERMISSIONS.reportsProfitRead)).toBe(
      true,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsSalesRead)).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsSalesRead)).toBe(
      false,
    );
  });

  it('protects products report endpoint with reportsSalesRead (T-53)', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'products')).toEqual([
      PERMISSIONS.reportsSalesRead,
    ]);

    expect(roleHasPermission('OWNER', PERMISSIONS.reportsSalesRead)).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsSalesRead)).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsSalesRead)).toBe(
      false,
    );
  });

  it('protects cash entries report endpoint with reportsCashMovementsRead (T-53)', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'cashEntries')).toEqual([
      PERMISSIONS.reportsCashMovementsRead,
    ]);

    expect(
      roleHasPermission('OWNER', PERMISSIONS.reportsCashMovementsRead),
    ).toBe(true);
    expect(
      roleHasPermission('ADMIN', PERMISSIONS.reportsCashMovementsRead),
    ).toBe(true);
    expect(
      roleHasPermission('CASHIER', PERMISSIONS.reportsCashMovementsRead),
    ).toBe(false);
  });

  it('protects cashier performance endpoint with reports permissions', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'cashiers')).toEqual([
      PERMISSIONS.reportsCashierPerformanceRead,
    ]);

    expect(
      roleHasPermission('OWNER', PERMISSIONS.reportsCashierPerformanceRead),
    ).toBe(true);
    expect(
      roleHasPermission('ADMIN', PERMISSIONS.reportsCashierPerformanceRead),
    ).toBe(true);
    expect(
      roleHasPermission('CASHIER', PERMISSIONS.reportsCashierPerformanceRead),
    ).toBe(false);
  });

  it('delegates profit query to ReportsService', async () => {
    const mockService = {
      profit: vi.fn().mockResolvedValue({
        summary: {
          totalRevenue: 1000000,
          netRevenue: 1000000,
          totalCogs: 400000,
          grossProfit: 600000,
          netProfit: 600000,
          profitMargin: 60.0,
          totalUnitsSold: 50,
          productCount: 5,
        },
        products: { data: [], page: 1, limit: 20, total: 0 },
        byCategory: [],
      }),
    };

    const controller = new ReportsController(mockService as any);
    const query: ProfitQueryDto = { page: 1, limit: 20 };
    const result = await controller.profit(query);

    expect(mockService.profit).toHaveBeenCalledWith(query);
    expect(result.summary.grossProfit).toBe(600000);
    expect(result.summary.profitMargin).toBe(60.0);
  });

  it('delegates dashboard query with actor role to filter busy hours (T-53)', async () => {
    const mockService = {
      dashboard: vi.fn().mockResolvedValue({
        period: { startDate: '2026-11-01', endDate: '2026-11-22' },
        kpis: {},
        hourlyHeatmap: [],
      }),
    };

    const controller = new ReportsController(mockService as any);
    const actor: AuthenticatedUser = {
      id: 'c-1',
      role: 'CASHIER',
      sessionId: 'sess-1',
    };
    await controller.dashboard(
      { startDate: '2026-11-01', endDate: '2026-11-22' } as any,
      actor,
    );

    expect(mockService.dashboard).toHaveBeenCalledWith(
      { startDate: '2026-11-01', endDate: '2026-11-22' },
      'CASHIER',
    );
  });

  describe('Export Endpoint (T-55)', () => {
    it('enforces concurrency limit of 1 export running per user', async () => {
      let releaseExport: () => void;
      const blockingPromise = new Promise<void>((resolve) => {
        releaseExport = resolve;
      });

      const mockService = {
        export: vi.fn().mockImplementation(() => blockingPromise),
      };

      const controller = new ReportsController(mockService as any);
      const actor: AuthenticatedUser = {
        id: 'user-export-1',
        role: 'OWNER',
        sessionId: 'sess-2',
      };
      const mockRes = {} as any;

      // Start first export (asynchronously)
      const export1 = controller.export('sales', {} as any, actor, mockRes);

      // Attempt second export for the same user concurrently
      await expect(
        controller.export('sales', {} as any, actor, mockRes),
      ).rejects.toThrow('Another export is already in progress for this user');

      releaseExport!();
      await export1;

      // Now a subsequent export should succeed after previous finished
      await expect(
        controller.export('sales', {} as any, actor, mockRes),
      ).resolves.toBeUndefined();
    });

    it('rejects export requests exceeding 92 days limit', async () => {
      const mockService = {
        export: vi.fn().mockImplementation(async () => {
          throw new Error('Export date range cannot exceed 92 days');
        }),
      };

      const controller = new ReportsController(mockService as any);
      const actor: AuthenticatedUser = {
        id: 'user-export-2',
        role: 'OWNER',
        sessionId: 'sess-3',
      };

      await expect(
        controller.export(
          'sales',
          {
            startDate: '2026-01-01',
            endDate: '2026-06-01',
            format: 'xlsx',
          } as any,
          actor,
          {} as any,
        ),
      ).rejects.toThrow('Export date range cannot exceed 92 days');
    });

    it('forbids Admin from exporting Owner-only profit reports', async () => {
      const mockService = {
        export: vi.fn(),
      };

      const controller = new ReportsController(mockService as any);
      const adminActor: AuthenticatedUser = {
        id: 'admin-1',
        role: 'ADMIN',
        sessionId: 'sess-4',
      };

      await expect(
        controller.export('profit', {} as any, adminActor, {} as any),
      ).rejects.toThrow('Owner permission required for profit reports');
      expect(mockService.export).not.toHaveBeenCalled();
    });
  });
});
