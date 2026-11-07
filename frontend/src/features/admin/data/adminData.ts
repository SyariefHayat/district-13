export interface AdminMetrics {
  todaySales: number;
  todayTransactions: number;
  cashSales: number;
  qrisSales: number;
  activeShiftsCount: number;
  lowStockCount: number;
  cashIn: number;
  cashOut: number;
  voidCount: number;
  voidValue: number;
}

export interface AdminActiveShift {
  id: string;
  userId: string;
  cashierName: string;
  openedAt: string;
  openingCash: number;
  expectedCash: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  transactionCount: number;
}

export interface AdminLowStockItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  displayStock: number;
  warehouseStock: number;
  minStockThreshold: number;
  status: "out_of_stock" | "needs_display_transfer" | "low_stock";
}

export interface AdminTransaction {
  id: string;
  transactionNumber: string;
  shiftId?: string | null;
  userId: string;
  cashierName: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: "CASH" | "QRIS";
  status: "COMPLETED" | "VOIDED";
  createdAt: string;
  itemCount: number;
}

export interface AdminStaffSchedule {
  id: string;
  userId: string;
  userName: string;
  shiftType: "MORNING" | "AFTERNOON" | "NIGHT" | "FULLDAY";
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "ABSENT";
  notes?: string;
}

export interface HourlyTrafficData {
  hour: number;
  transactionCount: number;
  totalSales: number;
}

export function formatIDR(value: number | string | undefined | null): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatTimeOnly(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}
