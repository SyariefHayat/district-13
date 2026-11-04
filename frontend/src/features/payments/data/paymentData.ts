export type PaymentType = "CASH" | "QRIS" | "CARD" | "E_WALLET" | "TRANSFER";

export type PaymentStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface PaymentMethodItem {
  id: string;
  name: string;
  code: string;
  type: PaymentType;
  provider: string;
  accountNumber: string;
  feePercentage: number;
  settlementTime: string;
  transactionCount: number;
  totalVolume: number;
  status: PaymentStatus;
  isActive: boolean;
  minAmount: number;
  description?: string;
  updatedAt: string;
}

export const formatPaymentAmount = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CASH: "Tunai (Cash)",
  QRIS: "QRIS",
  CARD: "Kartu Debit/Kredit",
  E_WALLET: "E-Wallet",
  TRANSFER: "Transfer Bank",
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: "pm-cash",
    name: "Tunai",
    code: "CASH",
    type: "CASH",
    provider: "Kasir Fisik",
    accountNumber: "Cash Drawer",
    feePercentage: 0,
    settlementTime: "Real-time",
    transactionCount: 0,
    totalVolume: 0,
    status: "ACTIVE",
    isActive: true,
    minAmount: 0,
    description: "Pembayaran tunai langsung di kasir pos.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pm-qris",
    name: "QRIS",
    code: "QRIS",
    type: "QRIS",
    provider: "QRIS Gateway",
    accountNumber: "NMID Dynamic",
    feePercentage: 0.7,
    settlementTime: "T+1 Hari Kerja",
    transactionCount: 0,
    totalVolume: 0,
    status: "ACTIVE",
    isActive: true,
    minAmount: 1000,
    description:
      "Kode QR dinamis yang di-generate otomatis per transaksi kasir.",
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;
