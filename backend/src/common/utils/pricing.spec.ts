import { describe, expect, it } from 'vitest';
import {
  calculateDiscount,
  calculateItemSubtotal,
  calculateTax,
  calculateTransactionTotals,
  roundRupiah,
} from './pricing.js';

describe('Pricing Library (T-35 / SAL-004..007)', () => {
  describe('roundRupiah', () => {
    it('rounds half-up to integer Rupiah without cents', () => {
      expect(roundRupiah(15000.4)).toBe(15000);
      expect(roundRupiah(15000.5)).toBe(15001);
      expect(roundRupiah(15000.6)).toBe(15001);
      expect(roundRupiah(0)).toBe(0);
      expect(roundRupiah(NaN)).toBe(0);
    });
  });

  describe('calculateItemSubtotal', () => {
    it('calculates price * quantity without addons', () => {
      const res = calculateItemSubtotal(10000, 3);
      expect(res.addonsTotal).toBe(0);
      expect(res.subtotal).toBe(30000);
    });

    it('calculates price * quantity with multiple addons', () => {
      const addons = [
        { id: 'add-1', price: 2000, quantity: 1 },
        { id: 'add-2', price: 1500, quantity: 2 }, // 3000
      ];
      // unit price: 10000 + 5000 = 15000. Qty = 2 => 30000
      const res = calculateItemSubtotal(10000, 2, addons);
      expect(res.addonsTotal).toBe(5000);
      expect(res.subtotal).toBe(30000);
    });
  });

  describe('calculateDiscount', () => {
    it('calculates percentage discount and rounds half-up', () => {
      // 10% of 25000 = 2500
      expect(calculateDiscount(25000, { type: 'PERCENTAGE', value: 10 })).toBe(
        2500,
      );

      // 15% of 15000 = 2250
      expect(calculateDiscount(15000, { type: 'PERCENTAGE', value: 15 })).toBe(
        2250,
      );

      // 33.3% of 10000 = 3330
      expect(
        calculateDiscount(10000, { type: 'PERCENTAGE', value: 33.3 }),
      ).toBe(3330);
    });

    it('calculates fixed/amount discount and clamps to subtotal (total cannot be negative)', () => {
      expect(calculateDiscount(25000, { type: 'FIXED', value: 5000 })).toBe(
        5000,
      );

      // Diskon > subtotal: harus dibatasi maksimal sebesar subtotal
      expect(calculateDiscount(25000, { type: 'FIXED', value: 50000 })).toBe(
        25000,
      );
      expect(calculateDiscount(25000, { type: 'PERCENTAGE', value: 120 })).toBe(
        25000,
      );
    });

    it('returns 0 for negative or missing discounts', () => {
      expect(calculateDiscount(25000, undefined)).toBe(0);
      expect(calculateDiscount(25000, { type: 'FIXED', value: -500 })).toBe(0);
    });
  });

  describe('calculateTax (Two Tax Modes: EXCLUSIVE and INCLUSIVE)', () => {
    it('calculates EXCLUSIVE tax (Mode Tambah: dpp * rate / 100)', () => {
      // DPP = 100000, Rate = 11% => Tax = 11000, Total = 111000
      const res = calculateTax(100000, 'EXCLUSIVE', 11);
      expect(res.taxAmount).toBe(11000);
      expect(res.dpp).toBe(100000);
      expect(res.total).toBe(111000);
    });

    it('calculates INCLUSIVE tax (Mode Termasuk: total * rate / (100 + rate))', () => {
      // Gross Total = 111000, Rate = 11% => Tax = 111000 * 11 / 111 = 11000, DPP = 100000, Total = 111000
      const res = calculateTax(111000, 'INCLUSIVE', 11);
      expect(res.taxAmount).toBe(11000);
      expect(res.dpp).toBe(100000);
      expect(res.total).toBe(111000);
    });

    it('handles rounding half-up on fractional taxes', () => {
      // 10% of 15 = 1.5 => rounds to 2
      const resExclusive = calculateTax(15, 'EXCLUSIVE', 10);
      expect(resExclusive.taxAmount).toBe(2);
      expect(resExclusive.total).toBe(17);

      // Inclusive: 15 * 10 / 110 = 1.3636 => rounds to 1
      const resInclusive = calculateTax(15, 'INCLUSIVE', 10);
      expect(resInclusive.taxAmount).toBe(1);
      expect(resInclusive.dpp).toBe(14);
      expect(resInclusive.total).toBe(15);
    });

    it('handles NONE mode or zero tax rate', () => {
      const resNone = calculateTax(50000, 'NONE', 11);
      expect(resNone.taxAmount).toBe(0);
      expect(resNone.total).toBe(50000);

      const resZeroRate = calculateTax(50000, 'EXCLUSIVE', 0);
      expect(resZeroRate.taxAmount).toBe(0);
      expect(resZeroRate.total).toBe(50000);
    });
  });

  describe('calculateTransactionTotals (Full Transaction Engine)', () => {
    it('calculates full transaction with cash payment and change', () => {
      const result = calculateTransactionTotals({
        items: [
          {
            productId: 'prod-1',
            unitPrice: 15000,
            quantity: 2,
            addons: [{ id: 'add-1', price: 2500, quantity: 1 }],
          }, // (15000 + 2500) * 2 = 35000
          {
            productId: 'prod-2',
            unitPrice: 20000,
            quantity: 1,
          }, // 20000
        ],
        discount: { type: 'FIXED', value: 5000 }, // Subtotal: 55000, DPP: 50000
        taxMode: 'EXCLUSIVE',
        taxRate: 10, // 10% of 50000 = 5000. Total = 55000
        paymentMethod: 'CASH',
        paidAmount: 100000,
      });

      expect(result.subtotal).toBe(55000);
      expect(result.discountAmount).toBe(5000);
      expect(result.dpp).toBe(50000);
      expect(result.taxAmount).toBe(5000);
      expect(result.total).toBe(55000);
      expect(result.paidAmount).toBe(100000);
      expect(result.changeAmount).toBe(45000);
      expect(result.isPaymentSufficient).toBe(true);
    });

    it('flags insufficient cash payment', () => {
      const result = calculateTransactionTotals({
        items: [{ productId: 'p1', unitPrice: 50000, quantity: 1 }],
        paymentMethod: 'CASH',
        paidAmount: 40000, // Less than total 50000
      });

      expect(result.total).toBe(50000);
      expect(result.isPaymentSufficient).toBe(false);
      expect(result.changeAmount).toBe(0);
    });

    it('validates non-cash (QRIS) requires exact match', () => {
      const validQris = calculateTransactionTotals({
        items: [{ productId: 'p1', unitPrice: 50000, quantity: 1 }],
        paymentMethod: 'QRIS',
        paidAmount: 50000,
      });
      expect(validQris.isPaymentSufficient).toBe(true);
      expect(validQris.changeAmount).toBe(0);

      const invalidQris = calculateTransactionTotals({
        items: [{ productId: 'p1', unitPrice: 50000, quantity: 1 }],
        paymentMethod: 'QRIS',
        paidAmount: 60000,
      });
      expect(invalidQris.isPaymentSufficient).toBe(false);
    });

    it('handles 100% discount safely without negative balance', () => {
      const result = calculateTransactionTotals({
        items: [{ productId: 'p1', unitPrice: 50000, quantity: 1 }],
        discount: { type: 'PERCENTAGE', value: 100 },
        paymentMethod: 'CASH',
        paidAmount: 0,
      });

      expect(result.subtotal).toBe(50000);
      expect(result.discountAmount).toBe(50000);
      expect(result.total).toBe(0);
      expect(result.changeAmount).toBe(0);
      expect(result.isPaymentSufficient).toBe(true);
    });
  });
});
