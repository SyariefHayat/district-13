export interface CashierShift {
  id: string;
  userId: string;
  openingCash: string;
  expectedCash?: string | null;
  closingCash?: string | null;
  cashDifference?: string | null;
  openedAt: string;
  closedAt?: string | null;
  closedBy?: string | null;
}

export interface CashierShiftSummary {
  shiftId: string;
  status: "OPEN" | "CLOSED";
  openingCash: string;
  expectedCash: string;
  closingCash?: string | null;
  cashDifference?: string | null;
  transactionCount: number;
  cashSales: string;
  cashIn: string;
  cashOut: string;
}

export interface CashMovementItem {
  id?: string;
  shiftId: string;
  type: "IN" | "OUT";
  amount: string;
  description?: string;
  createdAt?: string;
}

export interface CashierTransaction {
  id: string;
  transactionNumber: string;
  shiftId?: string | null;
  userId: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  status: "COMPLETED" | "VOIDED";
  createdAt: string;
  itemCount: number;
  cashierName?: string;
}

export interface CashierSchedule {
  id: string;
  userId: string;
  userName?: string;
  shiftType: "MORNING" | "AFTERNOON" | "NIGHT" | "FULLDAY";
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "ABSENT";
  notes?: string;
}

export interface CashierProductStock {
  id: string;
  name: string;
  sku?: string;
  price: number;
  categoryName: string;
  displayStock: number;
  isAvailable: boolean;
  isActive: boolean;
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
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function formatElapsed(openedAt?: string | null): string {
  if (!openedAt) return "-";
  try {
    const start = new Date(openedAt).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - start);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins} menit`;
    return `${hours} jam ${mins} m`;
  } catch {
    return "-";
  }
}
