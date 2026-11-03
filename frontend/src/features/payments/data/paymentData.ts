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

export const INITIAL_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: "pm-1",
    name: "Tunai",
    code: "CASH",
    type: "CASH",
    provider: "Kasir Fisik",
    accountNumber: "Drawer-01",
    feePercentage: 0,
    settlementTime: "Real-time",
    transactionCount: 842,
    totalVolume: 24650000,
    status: "ACTIVE",
    isActive: true,
    minAmount: 0,
    description: "Pembayaran langsung uang tunai di kasir pos.",
    updatedAt: "2026-11-03T08:00:00Z",
  },
  {
    id: "pm-2",
    name: "QRIS BCA",
    code: "QRIS_BCA",
    type: "QRIS",
    provider: "BCA / Midtrans",
    accountNumber: "NMID: ID10200392019",
    feePercentage: 0.7,
    settlementTime: "T+1 Hari Kerja",
    transactionCount: 615,
    totalVolume: 18450000,
    status: "ACTIVE",
    isActive: true,
    minAmount: 1000,
    description:
      "Kode QR dinamis yang di-generate otomatis per transaksi kasir.",
    updatedAt: "2026-11-03T10:30:00Z",
  },
  {
    id: "pm-3",
    name: "QRIS Statis",
    code: "QRIS_STATIC",
    type: "QRIS",
    provider: "Bank BCA",
    accountNumber: "NMID: ID10200392022",
    feePercentage: 0.7,
    settlementTime: "T+1 Hari Kerja",
    transactionCount: 142,
    totalVolume: 4260000,
    status: "ACTIVE",
    isActive: true,
    minAmount: 1000,
    description: "Akrilik QRIS statis di meja bar kasir.",
    updatedAt: "2026-11-02T15:00:00Z",
  },
  {
    id: "pm-4",
    name: "EDC BCA",
    code: "EDC_BCA",
    type: "CARD",
    provider: "Bank BCA",
    accountNumber: "TID: 88203912",
    feePercentage: 1.5,
    settlementTime: "T+1 Hari Kerja",
    transactionCount: 210,
    totalVolume: 12600000,
    status: "ACTIVE",
    isActive: true,
    minAmount: 10000,
    description: "Mesin EDC BCA untuk kartu debit dan kredit Visa/Mastercard.",
    updatedAt: "2026-11-03T12:00:00Z",
  },
  {
    id: "pm-5",
    name: "EDC Mandiri",
    code: "EDC_MANDIRI",
    type: "CARD",
    provider: "Bank Mandiri",
    accountNumber: "TID: 77192033",
    feePercentage: 1.5,
    settlementTime: "T+1 Hari Kerja",
    transactionCount: 95,
    totalVolume: 5700000,
    status: "ACTIVE",
    isActive: true,
    minAmount: 10000,
    description: "Terminal mesin EDC Mandiri cadangan.",
    updatedAt: "2026-11-01T09:15:00Z",
  },
  {
    id: "pm-6",
    name: "GoPay",
    code: "GOPAY",
    type: "E_WALLET",
    provider: "Midtrans",
    accountNumber: "MID: D13-01",
    feePercentage: 1.5,
    settlementTime: "T+2 Hari Kerja",
    transactionCount: 52,
    totalVolume: 1560000,
    status: "ACTIVE",
    isActive: true,
    minAmount: 5000,
    description: "Integrasi push payment langsung dompet digital.",
    updatedAt: "2026-10-28T14:20:00Z",
  },
  {
    id: "pm-7",
    name: "Transfer BCA",
    code: "VA_BCA",
    type: "TRANSFER",
    provider: "Bank Central Asia",
    accountNumber: "Prefix: 12903",
    feePercentage: 0,
    settlementTime: "Real-time",
    transactionCount: 18,
    totalVolume: 3600000,
    status: "INACTIVE",
    isActive: false,
    minAmount: 50000,
    description:
      "Transfer Virtual Account khusus pesanan katering dan bulk order.",
    updatedAt: "2026-10-25T11:00:00Z",
  },
];
