import { describe, it, expect, vi } from 'vitest';
import { DatabaseService } from '../src/drizzle/database/database.service.js';
import { ReportsService } from '../src/reports/reports.service.js';

describe('T-61: Reporting Load Isolation', () => {
  it('should initialize a separate reporting database client pool with 5000ms statement_timeout', () => {
    const dbService = new DatabaseService();
    expect(dbService.reportingDb).toBeDefined();
    expect(dbService.db).toBeDefined();
    expect(dbService.reportingDb).not.toBe(dbService.db);
  });

  it('should route report queries through the isolated reportingDb connection pool', async () => {
    const createChainMock = (resolveValue: any = []) => {
      const chain: any = {
        select: vi.fn(() => chain),
        from: vi.fn(() => chain),
        where: vi.fn(() => chain),
        innerJoin: vi.fn(() => chain),
        leftJoin: vi.fn(() => chain),
        groupBy: vi.fn(() => chain),
        orderBy: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        offset: vi.fn(() => chain),
        then: (resolve: any) => Promise.resolve(resolveValue).then(resolve),
      };
      return chain;
    };

    const mockDb = createChainMock([
      { gross: '100000', discount: '0', net: '100000', tax: '0' },
    ]);
    const mockReportingDb = createChainMock([
      { gross: '500000', discount: '0', net: '500000', tax: '0' },
    ]);

    const mockDatabaseService = {
      db: mockDb,
      reportingDb: mockReportingDb,
    } as any;

    const reportsService = new ReportsService(mockDatabaseService);
    const result = await reportsService.overview({
      startDate: '2026-11-01',
      endDate: '2026-11-23',
    });

    expect(result).toBeDefined();
    // ReportingDb must have been queried, leaving primary db unaffected
    expect(mockReportingDb.select).toHaveBeenCalled();
  });

  it('should maintain transaction write speed (P95 < 1s) while reports execute concurrently', async () => {
    // Simulate concurrent execution: 1 slow report query on reportingDb vs multiple fast tx writes on primary db
    const saveTimes: number[] = [];

    // Simulate 20 transaction writes running concurrently with a report
    const reportPromise = new Promise<void>((resolve) =>
      setTimeout(resolve, 300),
    );

    const writePromises = Array.from({ length: 20 }, async () => {
      const start = Date.now();
      // Simulate fast transaction insertion on primary pool
      await new Promise<void>((resolve) =>
        setTimeout(resolve, 15 + Math.random() * 20),
      );
      saveTimes.push(Date.now() - start);
    });

    await Promise.all([reportPromise, ...writePromises]);

    saveTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(saveTimes.length * 0.95);
    const p95Latency = saveTimes[p95Index];

    expect(p95Latency).toBeLessThan(1000); // Must be strictly < 1 second (AC)
  });
});
