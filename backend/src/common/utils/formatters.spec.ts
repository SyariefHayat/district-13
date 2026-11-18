import { describe, expect, it } from 'vitest';
import {
  formatRupiah,
  formatWibDate,
  getWibBusinessDate,
} from './formatters.js';

describe('SET-005 formatters (WIB and Rupiah)', () => {
  it('formats Rupiah as integer without fractional decimals', () => {
    expect(formatRupiah(15000)).toBe('Rp 15.000');
    expect(formatRupiah(0)).toBe('Rp 0');
    expect(formatRupiah(1250000)).toBe('Rp 1.250.000');
    expect(formatRupiah(null)).toBe('Rp 0');
    expect(formatRupiah(undefined)).toBe('Rp 0');
  });

  it('formats date in WIB timezone', () => {
    // 2026-11-18T00:30:00Z is 07:30 WIB (UTC+7)
    const date = new Date('2026-11-18T00:30:00Z');
    const formatted = formatWibDate(date);
    expect(formatted).toMatch(/07[:.]30/);
  });

  it('determines business date according to WIB (Asia/Jakarta)', () => {
    // 2026-11-18T16:59:00Z is 23:59 WIB on Nov 18
    const date1 = new Date('2026-11-18T16:59:00Z');
    expect(getWibBusinessDate(date1)).toBe('2026-11-18');

    // 2026-11-18T17:00:00Z is 00:00 WIB on Nov 19
    const date2 = new Date('2026-11-18T17:00:00Z');
    expect(getWibBusinessDate(date2)).toBe('2026-11-19');
  });
});
