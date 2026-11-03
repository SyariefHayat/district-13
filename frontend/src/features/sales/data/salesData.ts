export type TransactionStatus = "COMPLETED" | "VOIDED";
export type PaymentMethod = "CASH" | "QRIS";

export interface SaleItemAddon {
  id: string;
  transactionItemId: string;
  addonId: string;
  addonName: string;
  unitPrice: number;
  quantity: number;
}

export interface SaleItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotalAmount: number;
  addons?: SaleItemAddon[];
}

export interface SaleTransaction {
  id: string;
  transactionNumber: string;
  shiftId: string;
  userId: string;
  cashierName?: string;
  subtotalAmount: number;
  discountAmount: number;
  discountReason?: string | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  status: TransactionStatus;
  voidedBy?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  items?: SaleItem[];
}

export interface BackendTransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  subtotalAmount: string | number;
  addons?: {
    id: string;
    transactionItemId: string;
    addonId: string;
    addonName: string;
    unitPrice: string | number;
    quantity: number;
  }[];
}

export interface BackendTransaction {
  id: string;
  transactionNumber: string;
  shiftId: string;
  userId: string;
  cashier?: string;
  subtotalAmount: string | number;
  discountAmount: string | number;
  discountReason?: string | null;
  totalAmount: string | number;
  paymentMethod: PaymentMethod;
  paidAmount: string | number;
  changeAmount: string | number;
  status: TransactionStatus;
  voidedBy?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  items?: BackendTransactionItem[];
}

export interface SalesStats {
  totalTransactions: number;
  totalRevenue: number;
  cashRevenue: number;
  qrisRevenue: number;
  completedCount: number;
  voidedCount: number;
}

export function mapBackendTransaction(
  raw: BackendTransaction
): SaleTransaction {
  return {
    id: raw.id,
    transactionNumber: raw.transactionNumber,
    shiftId: raw.shiftId,
    userId: raw.userId,
    cashierName: raw.cashier || "Kasir",
    subtotalAmount: Number(raw.subtotalAmount) || 0,
    discountAmount: Number(raw.discountAmount) || 0,
    discountReason: raw.discountReason,
    totalAmount: Number(raw.totalAmount) || 0,
    paymentMethod: raw.paymentMethod,
    paidAmount: Number(raw.paidAmount) || 0,
    changeAmount: Number(raw.changeAmount) || 0,
    status: raw.status,
    voidedBy: raw.voidedBy,
    voidedAt: raw.voidedAt,
    voidReason: raw.voidReason,
    createdAt: raw.createdAt,
    items: raw.items?.map((item) => ({
      id: item.id,
      transactionId: item.transactionId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice) || 0,
      subtotalAmount: Number(item.subtotalAmount) || 0,
      addons: item.addons?.map((addon) => ({
        id: addon.id,
        transactionItemId: addon.transactionItemId,
        addonId: addon.addonId,
        addonName: addon.addonName,
        unitPrice: Number(addon.unitPrice) || 0,
        quantity: addon.quantity,
      })),
    })),
  };
}

export const formatIDR = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatSaleDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
};
