/**
 * Helper pemformat mata uang Rupiah (bilangan bulat tanpa desimal).
 * Menghasilkan format: "Rp 15.000", "Rp 0", dsb.
 */
export function formatRupiah(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "Rp 0";
  }

  const rounded = Math.round(value);
  const formattedNumber = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);

  return `Rp ${formattedNumber}`;
}

/**
 * Helper pemformat tanggal dan waktu dalam zona waktu Indonesia Barat (WIB / Asia/Jakarta).
 */
export function formatWibDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "-";

  const dateObj = typeof date === "object" ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "-";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
  };

  return new Intl.DateTimeFormat("id-ID", defaultOptions).format(dateObj);
}
