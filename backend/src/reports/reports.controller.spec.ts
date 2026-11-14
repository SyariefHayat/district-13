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

function methodMetadata(key: string, method: keyof ReportsController) {
  const handler = Object.getOwnPropertyDescriptor(
    ReportsController.prototype,
    method,
  )?.value;
  return Reflect.getMetadata(key, handler);
}

describe('ReportsController authorization', () => {
  it('protects profit analytics endpoint with reports permissions', () => {
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'profit')).toEqual([
      PERMISSIONS.reportsProfitRead,
      PERMISSIONS.reportsSalesRead,
    ]);

    expect(roleHasPermission('OWNER', PERMISSIONS.reportsProfitRead)).toBe(
      true,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsSalesRead)).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsProfitRead)).toBe(
      false,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsSalesRead)).toBe(
      false,
    );
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

  it('delegates cashiers query to ReportsService', async () => {
    const mockService = {
      cashierPerformance: vi.fn().mockResolvedValue({
        summary: {
          totalCashiers: 2,
          totalTransactions: 50,
          totalSales: 5000000,
          totalDifference: 0,
          averageAccuracy: 100,
          totalVoidCount: 0,
          totalVoidAmount: 0,
        },
        cashiers: { data: [], page: 1, limit: 10, total: 2 },
      }),
    };

    const controller = new ReportsController(mockService as any);
    const query = { page: 1, limit: 10 };
    const result = await controller.cashiers(query as any);

    expect(mockService.cashierPerformance).toHaveBeenCalledWith(query);
    expect(result.summary.totalCashiers).toBe(2);
  });

  it('protects cash movements report endpoint with reports permissions', () => {
    expect(methodMetadata(ANY_PERMISSIONS_KEY, 'cash')).toEqual([
      PERMISSIONS.reportsCashRead,
      PERMISSIONS.reportsCashMovementsRead,
    ]);

    expect(roleHasPermission('OWNER', PERMISSIONS.reportsCashRead)).toBe(true);
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsCashRead)).toBe(true);
    expect(
      roleHasPermission('ADMIN', PERMISSIONS.reportsCashMovementsRead),
    ).toBe(true);
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsCashRead)).toBe(
      false,
    );
    expect(
      roleHasPermission('CASHIER', PERMISSIONS.reportsCashMovementsRead),
    ).toBe(false);
  });

  it('delegates cash report query to ReportsService', async () => {
    const mockService = {
      cash: vi.fn().mockResolvedValue({
        cashIn: '500000',
        cashOut: '100000',
        netCashFlow: '400000.00',
        inCount: 2,
        outCount: 1,
        totalCount: 3,
        movements: {
          data: [
            {
              id: 'cm-1',
              shiftId: 's-1',
              recordedBy: 'u-1',
              username: 'admin',
              type: 'IN',
              amount: 500000,
              description: 'Modal awal',
              createdAt: new Date().toISOString(),
            },
          ],
          page: 1,
          limit: 10,
          total: 1,
        },
      }),
    };

    const controller = new ReportsController(mockService as any);
    const query = { page: 1, limit: 10, type: 'IN' as const };
    const result = await controller.cash(query as any);

    expect(mockService.cash).toHaveBeenCalledWith(query);
    expect(result.cashIn).toBe('500000');
    expect(result.movements.data).toHaveLength(1);
    expect(result.movements.data[0].amount).toBe(500000);
  });

  it('protects shifts report endpoint with reports permissions', () => {
    expect(methodMetadata(PERMISSIONS_KEY, 'shifts')).toEqual([
      PERMISSIONS.reportsShiftsRead,
    ]);

    expect(roleHasPermission('OWNER', PERMISSIONS.reportsShiftsRead)).toBe(
      true,
    );
    expect(roleHasPermission('ADMIN', PERMISSIONS.reportsShiftsRead)).toBe(
      true,
    );
    expect(roleHasPermission('CASHIER', PERMISSIONS.reportsShiftsRead)).toBe(
      false,
    );
  });

  it('delegates shifts report query to ReportsService', async () => {
    const mockService = {
      shifts: vi.fn().mockResolvedValue({
        summary: {
          totalShifts: 1,
          openShifts: 0,
          closedShifts: 1,
          totalClosingCash: 1500000,
          totalCashDifference: 0,
          totalTransactions: 25,
        },
        data: [
          {
            id: 'sh-1',
            userId: 'u-1',
            username: 'kasir1',
            openedAt: new Date().toISOString(),
            closedAt: new Date().toISOString(),
            openingCash: 300000,
            expectedCash: 1500000,
            closingCash: 1500000,
            cashDifference: 0,
            transactionCount: 25,
          },
        ],
        page: 1,
        limit: 10,
        total: 1,
      }),
    };

    const controller = new ReportsController(mockService as any);
    const query = { page: 1, limit: 10, status: 'CLOSED' as const };
    const result = await controller.shifts(query as any);

    expect(mockService.shifts).toHaveBeenCalledWith(query);
    expect(result.summary.totalShifts).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].username).toBe('kasir1');
  });
});
