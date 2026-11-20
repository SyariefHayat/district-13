/**
 * Utilities for formatting according to REQ-F-SET-005:
 * - Timezone in Western Indonesian Time (WIB / Asia/Jakarta, UTC+7).
 * - Currency in Indonesian Rupiah (IDR) without fractional/decimal cents.
 */

export function getWibBusinessDate(date: Date | string = new Date()): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

export const businessDate = getWibBusinessDate;

export function formatWibDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '-';
  const dateObj = typeof date === 'object' ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  };

  return new Intl.DateTimeFormat('id-ID', defaultOptions).format(dateObj);
}

export function formatRupiah(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'Rp 0';
  }

  const rounded = Math.round(value);
  const formattedNumber = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);

  return `Rp ${formattedNumber}`;
}
