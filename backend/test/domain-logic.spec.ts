import { describe, it, expect } from 'vitest';
import {
  calculateDiscount,
  calculateTax,
  calculateTransactionTotals,
  calculateShiftReconciliation,
  analyzeShiftTiming,
  validateSyncBatch,
} from '../src/common/domain/domain-logic.js';

describe('T-69: Domain Logic Unit Tests (Coverage >= 80%)', () => {
  describe('1. Pricing & Discount Engine', () => {
    it('calculates percentage discounts with half-up rounding', () => {
      // 10% of 25,000 = 2,500
      expect(calculateDiscount(25000, { type: 'PERCENTAGE', value: 10 })).toBe(
        2500,
      );
      // 33.3% of 10,000 = 3330 (half-up)
      expect(
        calculateDiscount(10000, { type: 'PERCENTAGE', value: 33.3 }),
      ).toBe(3330);
    });

    it('clamps discounts between 0 and base amount', () => {
      // Over 100% discount clamps to baseAmount
      expect(calculateDiscount(50000, { type: 'PERCENTAGE', value: 120 })).toBe(
        50000,
      );
      // Fixed discount greater than total clamps to baseAmount
      expect(calculateDiscount(30000, { type: 'FIXED', value: 45000 })).toBe(
        30000,
      );
      // Negative discount returns 0
      expect(calculateDiscount(30000, { type: 'FIXED', value: -1000 })).toBe(0);
      // Undefined discount returns 0
      expect(calculateDiscount(30000, undefined)).toBe(0);
    });
  });

  describe('2. Dual Tax Modes (EXCLUSIVE vs INCLUSIVE)', () => {
    it('calculates EXCLUSIVE tax (Pajak Ditambahkan ke Subtotal)', () => {
      // Subtotal 100,000 with 11% PPN: DPP 100,000, Tax 11,000, Total 111,000
      const res = calculateTax(100000, 'EXCLUSIVE', 11);
      expect(res.dpp).toBe(100000);
      expect(res.taxAmount).toBe(11000);
      expect(res.total).toBe(111000);
    });

    it('calculates INCLUSIVE tax (Pajak Termasuk dalam Harga)', () => {
      // Total 111,000 with 11% PPN: Tax = 111000 * 11 / 111 = 11,000, DPP = 100,000
      const res = calculateTax(111000, 'INCLUSIVE', 11);
      expect(res.taxAmount).toBe(11000);
      expect(res.dpp).toBe(100000);
      expect(res.total).toBe(111000);
    });

    it('returns zero tax for NONE mode or 0 rate', () => {
      const resNone = calculateTax(50000, 'NONE', 11);
      expect(resNone.taxAmount).toBe(0);
      expect(resNone.total).toBe(50000);

      const resZero = calculateTax(50000, 'EXCLUSIVE', 0);
      expect(resZero.taxAmount).toBe(0);
      expect(resZero.total).toBe(50000);
    });
  });

  describe('3. Cash Change & Payment Validation', () => {
    it('calculates correct cash change when paid > total', () => {
      const result = calculateTransactionTotals({
        items: [
          {
            productId: 'prod-1',
            unitPrice: 20000,
            quantity: 2,
            addons: [{ id: 'add-1', price: 5000 }], // 25,000 * 2 = 50,000
          },
        ],
        paymentMethod: 'CASH',
        paidAmount: 100000,
      });

      expect(result.totalAmount).toBe(50000);
      expect(result.isValidPayment).toBe(true);
      expect(result.changeAmount).toBe(50000);
    });

    it('rejects underpaid cash payment', () => {
      const result = calculateTransactionTotals({
        items: [{ productId: 'prod-1', unitPrice: 30000, quantity: 1 }],
        paymentMethod: 'CASH',
        paidAmount: 20000, // Underpaid
      });

      expect(result.isValidPayment).toBe(false);
      expect(result.changeAmount).toBe(0);
    });

    it('validates QRIS payment requires exact paidAmount and zero change', () => {
      const validQris = calculateTransactionTotals({
        items: [{ productId: 'prod-1', unitPrice: 35000, quantity: 1 }],
        paymentMethod: 'QRIS',
        paidAmount: 35000,
      });
      expect(validQris.isValidPayment).toBe(true);
      expect(validQris.changeAmount).toBe(0);

      const invalidQris = calculateTransactionTotals({
        items: [{ productId: 'prod-1', unitPrice: 35000, quantity: 1 }],
        paymentMethod: 'QRIS',
        paidAmount: 40000, // Must match exact
      });
      expect(invalidQris.isValidPayment).toBe(false);
    });
  });

  describe('4. Shift Reconciliation (Expected Cash & Selisih Kas)', () => {
    it('calculates exact cash balance with zero variance', () => {
      const result = calculateShiftReconciliation({
        openingCash: 200000,
        cashSalesTotal: 450000,
        cashMovementsIn: 50000,
        cashMovementsOut: 100000,
        closingCashActual: 600000, // 200k + 450k + 50k - 100k = 600k
      });

      expect(result.expectedCash).toBe(600000);
      expect(result.closingCash).toBe(600000);
      expect(result.cashDifference).toBe(0);
      expect(result.status).toBe('EXACT');
    });

    it('detects cash overage (lebih kas / OVER)', () => {
      const result = calculateShiftReconciliation({
        openingCash: 100000,
        cashSalesTotal: 200000,
        cashMovementsIn: 0,
        cashMovementsOut: 0,
        closingCashActual: 320000, // +20,000 overage
      });

      expect(result.expectedCash).toBe(300000);
      expect(result.cashDifference).toBe(20000);
      expect(result.status).toBe('OVER');
    });

    it('detects cash shortage (selisih kurang / SHORT)', () => {
      const result = calculateShiftReconciliation({
        openingCash: 100000,
        cashSalesTotal: 200000,
        cashMovementsIn: 0,
        cashMovementsOut: 0,
        closingCashActual: 285000, // -15,000 shortage
      });

      expect(result.expectedCash).toBe(300000);
      expect(result.cashDifference).toBe(-15000);
      expect(result.status).toBe('SHORT');
    });
  });

  describe('5. Midnight-Crossing Shifts & Canonical Operating Date', () => {
    it('anchors midnight-crossing shift to initial opening date in WIB', () => {
      // Shift opened at 2026-11-20 22:00 WIB and closed at 2026-11-21 04:00 WIB
      const openTime = new Date('2026-11-20T15:00:00.000Z'); // 22:00 WIB
      const closeTime = new Date('2026-11-20T21:00:00.000Z'); // 04:00 WIB next day

      const analysis = analyzeShiftTiming(openTime, closeTime);
      expect(analysis.canonicalBusinessDate).toBe('2026-11-20');
      expect(analysis.isMidnightCrossing).toBe(true);
      expect(analysis.durationMinutes).toBe(360); // 6 hours
      expect(analysis.isOvertimeWarning).toBe(false);
    });

    it('flags overtime warning when shift duration exceeds 10 hours (SHF-012)', () => {
      const openTime = new Date('2026-11-20T08:00:00+07:00');
      const closeTime = new Date('2026-11-20T19:30:00+07:00'); // 11.5 hours

      const analysis = analyzeShiftTiming(openTime, closeTime);
      expect(analysis.durationMinutes).toBe(690);
      expect(analysis.isOvertimeWarning).toBe(true);
    });
  });

  describe('6. Offline Sync Rules & Validation', () => {
    it('validates batches within 50 events', () => {
      const events = Array.from({ length: 45 }, (_, i) => ({
        id: `event-${i}`,
        timestamp: new Date().toISOString(),
        type: 'TRANSACTION_CREATE',
      }));

      const res = validateSyncBatch(events);
      expect(res.isValid).toBe(true);
      expect(res.eventCount).toBe(45);
      expect(res.isLateSync).toBe(false);
    });

    it('rejects sync batch exceeding 50 events', () => {
      const events = Array.from({ length: 51 }, (_, i) => ({
        id: `event-${i}`,
        timestamp: new Date().toISOString(),
        type: 'TRANSACTION_CREATE',
      }));

      const res = validateSyncBatch(events);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('limit of 50 events');
    });

    it('flags late sync when events originate from previous business dates', () => {
      const pastEvents = [
        {
          id: 'event-old',
          timestamp: '2026-11-10T10:00:00+07:00', // Past date
          type: 'TRANSACTION_CREATE',
        },
      ];

      const res = validateSyncBatch(
        pastEvents,
        new Date('2026-11-24T10:00:00+07:00'),
      );
      expect(res.isValid).toBe(true);
      expect(res.isLateSync).toBe(true);
    });
  });
});
