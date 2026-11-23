import { describe, it, expect, vi } from 'vitest';
import { MaintenanceService } from '../src/maintenance/maintenance.service.js';

describe('T-63: Nightly Maintenance Routine (03.00-04.00 WIB)', () => {
  it('should run VACUUM ANALYZE, recompute dirty days, and reconcile stock with downtime <= 5 min (0s)', async () => {
    const mockDb = {
      execute: vi.fn().mockResolvedValue([]),
    };
    const mockDatabase = {
      db: mockDb,
    } as any;

    const mockDailySummaries = {
      recomputeDirty: vi.fn().mockResolvedValue({
        recomputedDates: ['2026-11-20', '2026-11-21'],
      }),
    } as any;

    const maintenanceService = new MaintenanceService(
      mockDatabase,
      mockDailySummaries,
    );
    const report = await maintenanceService.runNightlyMaintenance(true);

    expect(report).toBeDefined();
    expect(report.status).toBe('COMPLETED');
    expect(report.downtimeSeconds).toBeLessThanOrEqual(300); // Downtime <= 5 minutes
    expect(report.downtimeSeconds).toBe(0); // Zero downtime achieved
    expect(report.dirtyDaysRecomputed).toEqual(['2026-11-20', '2026-11-21']);
    expect(report.vacuumStatus).toBe('SUCCESS');

    // Verify step 1: VACUUM ANALYZE was executed
    expect(mockDb.execute).toHaveBeenCalledTimes(2); // Step 1 analyze + Step 3 reconciliation
    // Verify step 2: dirty days recomputation was triggered
    expect(mockDailySummaries.recomputeDirty).toHaveBeenCalled();
  });

  it('should correctly identify stock reconciliation discrepancies', async () => {
    const mockDb = {
      execute: vi
        .fn()
        .mockResolvedValue([
          { product_id: 'prod-1', current_stock: '10', movement_sum: '15' },
        ]),
    };
    const mockDatabase = { db: mockDb } as any;
    const mockDailySummaries = {
      recomputeDirty: vi.fn().mockResolvedValue({ recomputedDates: [] }),
    } as any;

    const maintenanceService = new MaintenanceService(
      mockDatabase,
      mockDailySummaries,
    );
    const discrepancies = await maintenanceService.reconcileStockBalances();

    expect(discrepancies).toHaveLength(1);
    expect(discrepancies[0]).toEqual({
      productId: 'prod-1',
      stockQty: 10,
      movementSum: 15,
    });
  });
});
