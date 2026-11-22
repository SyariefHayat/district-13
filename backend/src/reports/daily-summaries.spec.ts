import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailySummariesService } from './daily-summaries.service.js';

describe('DailySummariesService', () => {
  let service: DailySummariesService;
  let mockDb: any;

  const createChain = (resolveValue: any = []) => {
    const chain: any = {
      from: vi.fn(() => chain),
      innerJoin: vi.fn(() => chain),
      where: vi.fn(() => chain),
      groupBy: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      values: vi.fn(() => chain),
      onConflictDoUpdate: vi.fn(() => chain),
      onConflictDoNothing: vi.fn(() => chain),
      then: (onResolve: any) => Promise.resolve(resolveValue).then(onResolve),
    };
    return chain;
  };

  beforeEach(() => {
    mockDb = {
      insert: vi.fn(() => createChain([])),
      delete: vi.fn(() => createChain([])),
      select: vi.fn(() => createChain([])),
    };

    const mockDatabaseService = { db: mockDb } as any;
    service = new DailySummariesService(mockDatabaseService);
  });

  describe('Incremental Updates', () => {
    it('updates daily sales, product, and cashier summaries on transaction completed', async () => {
      // For product costPrice lookup
      mockDb.select.mockReturnValueOnce(createChain([{ costPrice: '15000' }]));

      const txData = {
        id: 'tx-1',
        transactionNumber: 'D13-20261122-0001',
        userId: 'user-cashier-1',
        subtotalAmount: 50000,
        discountAmount: 5000,
        totalAmount: 45000,
        paymentMethod: 'CASH' as const,
        createdAt: new Date('2026-11-22T10:00:00+07:00'),
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            unitPrice: 25000,
            subtotalAmount: 50000,
          },
        ],
      };

      await service.onTransactionCompleted(txData);

      // Verify insert was called for dailySalesSummary, dailyProductSummary, dailyCashierSummary
      expect(mockDb.insert).toHaveBeenCalledTimes(3);
    });

    it('marks day dirty when transaction voided and increments void counter', async () => {
      await service.onTransactionVoided('2026-11-22', 'user-cashier-1', 45000);

      // 1. markDirty insert into dirtyDays
      // 2. update dailyCashierSummary void count
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
    });

    it('marks date as dirty for late sync transactions', async () => {
      const pastTxData = {
        id: 'tx-old',
        transactionNumber: 'D13-20261110-0001',
        userId: 'user-cashier-1',
        subtotalAmount: 30000,
        discountAmount: 0,
        totalAmount: 30000,
        paymentMethod: 'QRIS' as const,
        createdAt: new Date('2026-11-10T10:00:00+07:00'),
        items: [],
        isLateSync: true,
      };

      await service.onTransactionCompleted(pastTxData);

      // Should have inserted into dirtyDays
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('Summary Recomputation & Idempotency (T-52 AC)', () => {
    it('recomputes date by aggregating from critical transactions and clears dirty marker', async () => {
      // 1. salesAgg
      mockDb.select.mockReturnValueOnce(
        createChain([
          {
            revenue: '45000',
            transactionCount: 1,
            discountTotal: '5000',
            cashRevenue: '45000',
            qrisRevenue: '0',
          },
        ]),
      );
      // 2. productAggs
      mockDb.select.mockReturnValueOnce(
        createChain([
          {
            productId: 'p-1',
            quantity: 2,
            revenue: '50000',
            cost: '30000',
          },
        ]),
      );
      // 3. cashierAggs
      mockDb.select.mockReturnValueOnce(
        createChain([
          {
            cashierId: 'c-1',
            transactionCount: 1,
            salesTotal: '45000',
            discountTotal: '5000',
            voidCount: 0,
          },
        ]),
      );

      await service.recomputeDate('2026-11-22');

      // Verify dailySalesSummary, dailyProductSummary, and dailyCashierSummary were inserted
      expect(mockDb.insert).toHaveBeenCalledTimes(3);
      // Verify existing product & cashier summaries for date were cleared and dirtyDays deleted
      expect(mockDb.delete).toHaveBeenCalledTimes(3);
    });

    it('recomputes all marked dirty days idempotently', async () => {
      mockDb.select.mockReturnValueOnce(
        createChain([
          { businessDate: '2026-11-20' },
          { businessDate: '2026-11-21' },
        ]),
      );

      const recomputeSpy = vi
        .spyOn(service, 'recomputeDate')
        .mockResolvedValue(undefined);

      const result = await service.recomputeDirty();

      expect(result.recomputedDates).toEqual(['2026-11-20', '2026-11-21']);
      expect(recomputeSpy).toHaveBeenCalledTimes(2);
      expect(recomputeSpy).toHaveBeenCalledWith('2026-11-20');
      expect(recomputeSpy).toHaveBeenCalledWith('2026-11-21');
    });
  });
});
