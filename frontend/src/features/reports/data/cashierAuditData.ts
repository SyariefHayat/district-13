export interface CashierAuditItem {
  id: string;
  cashierId: string;
  cashierName: string;
  cashierCode: string;
  role: string;
  totalShifts: number;
  totalTransactions: number;
  totalSales: number;
  cashExpected: number;
  cashActual: number;
  cashDifference: number;
  accuracyRate: number;
  voidCount: number;
  voidAmount: number;
  discountCount: number;
  discountAmount: number;
  auditStatus: "NORMAL" | "WARNING" | "CRITICAL";
  lastAuditDate: string;
  notes?: string;
}

export interface CashierAuditSummary {
  totalCashiers: number;
  totalTransactions: number;
  totalSales: number;
  totalDifference: number;
  averageAccuracy: number;
  totalVoidCount: number;
  totalVoidAmount: number;
}

export const SAMPLE_CASHIER_AUDITS: CashierAuditItem[] = [
  {
    id: "ca-001",
    cashierId: "usr-01",
    cashierName: "Ahmad Fauzi",
    cashierCode: "KSR-001",
    role: "Senior Cashier",
    totalShifts: 24,
    totalTransactions: 420,
    totalSales: 16800000,
    cashExpected: 9200000,
    cashActual: 9200000,
    cashDifference: 0,
    accuracyRate: 100.0,
    voidCount: 1,
    voidAmount: 35000,
    discountCount: 12,
    discountAmount: 180000,
    auditStatus: "NORMAL",
    lastAuditDate: "2026-11-05 14:00",
    notes: "Rekonsiliasi kas sempurna tanpa selisih.",
  },
  {
    id: "ca-002",
    cashierId: "usr-02",
    cashierName: "Siti Rahma",
    cashierCode: "KSR-002",
    role: "Kasir Utama",
    totalShifts: 22,
    totalTransactions: 385,
    totalSales: 14500000,
    cashExpected: 8100000,
    cashActual: 8095000,
    cashDifference: -5000,
    accuracyRate: 99.9,
    voidCount: 2,
    voidAmount: 50000,
    discountCount: 15,
    discountAmount: 225000,
    auditStatus: "NORMAL",
    lastAuditDate: "2026-11-05 13:30",
    notes: "Selisih kecil Rp 5.000 dalam batas toleransi wajar.",
  },
  {
    id: "ca-003",
    cashierId: "usr-03",
    cashierName: "Budi Santoso",
    cashierCode: "KSR-003",
    role: "Kasir Siang",
    totalShifts: 20,
    totalTransactions: 310,
    totalSales: 11800000,
    cashExpected: 6400000,
    cashActual: 6360000,
    cashDifference: -40000,
    accuracyRate: 99.3,
    voidCount: 4,
    voidAmount: 120000,
    discountCount: 8,
    discountAmount: 95000,
    auditStatus: "WARNING",
    lastAuditDate: "2026-11-04 22:00",
    notes:
      "Selisih kas berulang 2 hari terakhir, perlu re-training rekonsiliasi uang kembalian.",
  },
  {
    id: "ca-004",
    cashierId: "usr-04",
    cashierName: "Rina Wulandari",
    cashierCode: "KSR-004",
    role: "Kasir Pagi",
    totalShifts: 25,
    totalTransactions: 450,
    totalSales: 18200000,
    cashExpected: 10500000,
    cashActual: 10510000,
    cashDifference: 10000,
    accuracyRate: 99.9,
    voidCount: 1,
    voidAmount: 28000,
    discountCount: 18,
    discountAmount: 260000,
    auditStatus: "NORMAL",
    lastAuditDate: "2026-11-05 11:45",
    notes:
      "Surplus kas Rp 10.000 karena pelanggan menolak uang kembalian receh.",
  },
  {
    id: "ca-005",
    cashierId: "usr-05",
    cashierName: "Dian Pratama",
    cashierCode: "KSR-005",
    role: "Kasir Malam",
    totalShifts: 18,
    totalTransactions: 260,
    totalSales: 9400000,
    cashExpected: 5200000,
    cashActual: 5080000,
    cashDifference: -120000,
    accuracyRate: 97.7,
    voidCount: 7,
    voidAmount: 215000,
    discountCount: 5,
    discountAmount: 60000,
    auditStatus: "CRITICAL",
    lastAuditDate: "2026-11-04 23:30",
    notes:
      "Selisih minus Rp 120.000 dan frekuensi void cukup tinggi (7x), butuh audit investigasi pengawas.",
  },
  {
    id: "ca-006",
    cashierId: "usr-06",
    cashierName: "Fajar Nugraha",
    cashierCode: "KSR-006",
    role: "Junior Cashier",
    totalShifts: 15,
    totalTransactions: 195,
    totalSales: 7350000,
    cashExpected: 4100000,
    cashActual: 4085000,
    cashDifference: -15000,
    accuracyRate: 99.6,
    voidCount: 3,
    voidAmount: 75000,
    discountCount: 6,
    discountAmount: 85000,
    auditStatus: "NORMAL",
    lastAuditDate: "2026-11-03 16:15",
    notes: "Kasir baru magang, performa relatif stabil.",
  },
  {
    id: "ca-007",
    cashierId: "usr-07",
    cashierName: "Maya Lestari",
    cashierCode: "KSR-007",
    role: "Kasir Utama",
    totalShifts: 23,
    totalTransactions: 390,
    totalSales: 15600000,
    cashExpected: 8900000,
    cashActual: 8900000,
    cashDifference: 0,
    accuracyRate: 100.0,
    voidCount: 0,
    voidAmount: 0,
    discountCount: 14,
    discountAmount: 195000,
    auditStatus: "NORMAL",
    lastAuditDate: "2026-11-05 12:00",
    notes: "Nol void nota dan tanpa selisih kas sepanjang shift.",
  },
  {
    id: "ca-008",
    cashierId: "usr-08",
    cashierName: "Hendra Wijaya",
    cashierCode: "KSR-008",
    role: "Kasir Siang",
    totalShifts: 19,
    totalTransactions: 280,
    totalSales: 10850000,
    cashExpected: 5900000,
    cashActual: 5865000,
    cashDifference: -35000,
    accuracyRate: 99.4,
    voidCount: 3,
    voidAmount: 82000,
    discountCount: 9,
    discountAmount: 110000,
    auditStatus: "WARNING",
    lastAuditDate: "2026-11-04 18:30",
    notes: "Selisih minus Rp 35.000 pada shift ramai jam makan siang.",
  },
];

export const calculateCashierAuditSummary = (
  items: CashierAuditItem[]
): CashierAuditSummary => {
  const totalTransactions = items.reduce(
    (sum, i) => sum + i.totalTransactions,
    0
  );
  const totalSales = items.reduce((sum, i) => sum + i.totalSales, 0);
  const totalDifference = items.reduce((sum, i) => sum + i.cashDifference, 0);
  const totalVoidCount = items.reduce((sum, i) => sum + i.voidCount, 0);
  const totalVoidAmount = items.reduce((sum, i) => sum + i.voidAmount, 0);
  const averageAccuracy =
    items.length > 0
      ? Number(
          (
            items.reduce((sum, i) => sum + i.accuracyRate, 0) / items.length
          ).toFixed(1)
        )
      : 100;

  return {
    totalCashiers: items.length,
    totalTransactions,
    totalSales,
    totalDifference,
    averageAccuracy,
    totalVoidCount,
    totalVoidAmount,
  };
};

export const SAMPLE_CASHIER_AUDIT_SUMMARY: CashierAuditSummary = {
  totalCashiers: 0,
  totalTransactions: 0,
  totalSales: 0,
  totalDifference: 0,
  averageAccuracy: 100,
  totalVoidCount: 0,
  totalVoidAmount: 0,
};
