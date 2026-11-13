export type CashMovementType = "IN" | "OUT";

export interface CashMovementItem {
  id: string;
  shiftId: string;
  recordedBy: string;
  recordedByName?: string;
  type: CashMovementType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface CashReportSummary {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  totalCount: number;
  inCount: number;
  outCount: number;
}

export interface BackendCashMovement {
  id: string;
  shiftId: string;
  recordedBy: string;
  username?: string;
  type: CashMovementType;
  amount: number | string;
  description?: string;
  createdAt: string;
}

export interface BackendCashReportResponse {
  cashSales?: string | number;
  qrisSales?: string | number;
  voidCount?: number;
  voidValue?: string | number;
  cashIn?: string | number;
  cashOut?: string | number;
  netCashFlow?: string | number;
  inCount?: number;
  outCount?: number;
  totalCount?: number;
  summary?: {
    cashSales?: string | number;
    qrisSales?: string | number;
    voidCount?: number;
    voidValue?: string | number;
  };
  moves?: {
    cashIn?: string | number;
    cashOut?: string | number;
  };
  movements?: {
    data: BackendCashMovement[];
    page: number;
    limit: number;
    total: number;
  };
  transactions?: {
    data: Array<{
      transaction: {
        id: string;
        transactionNumber: string;
        totalAmount: string | number;
        paymentMethod: string;
        createdAt: string;
        status: string;
      };
      shiftId: string;
      cashierId: string;
    }>;
    page: number;
    limit: number;
    total: number;
  };
}

export const formatCashDate = (dateStr: string): string => {
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

export const SAMPLE_CASH_MOVEMENTS: CashMovementItem[] = [
  {
    id: "cm-001",
    shiftId: "shift-01",
    recordedBy: "usr-01",
    recordedByName: "Siti Rahma",
    type: "IN",
    amount: 300000,
    description: "Modal awal kembalian kasir shift pagi",
    createdAt: "2026-11-05T07:05:00.000Z",
  },
  {
    id: "cm-002",
    shiftId: "shift-01",
    recordedBy: "usr-01",
    recordedByName: "Siti Rahma",
    type: "OUT",
    amount: 45000,
    description: "Beli es batu kristal (3 karung kecil)",
    createdAt: "2026-11-05T08:30:00.000Z",
  },
  {
    id: "cm-003",
    shiftId: "shift-01",
    recordedBy: "usr-01",
    recordedByName: "Siti Rahma",
    type: "OUT",
    amount: 38000,
    description: "Beli air mineral galon untuk dapur (2 galon)",
    createdAt: "2026-11-05T09:45:00.000Z",
  },
  {
    id: "cm-004",
    shiftId: "shift-02",
    recordedBy: "usr-02",
    recordedByName: "Budi Santoso",
    type: "IN",
    amount: 150000,
    description: "Tambah uang kembalian pecahan Rp 2.000 & Rp 5.000",
    createdAt: "2026-11-05T10:15:00.000Z",
  },
  {
    id: "cm-005",
    shiftId: "shift-02",
    recordedBy: "usr-02",
    recordedByName: "Budi Santoso",
    type: "OUT",
    amount: 60000,
    description: "Beli gas LPG 3kg darurat untuk kompor",
    createdAt: "2026-11-05T11:20:00.000Z",
  },
  {
    id: "cm-006",
    shiftId: "shift-03",
    recordedBy: "usr-03",
    recordedByName: "Ahmad Fauzi",
    type: "IN",
    amount: 300000,
    description: "Modal awal kasir shift sore",
    createdAt: "2026-11-04T15:05:00.000Z",
  },
  {
    id: "cm-007",
    shiftId: "shift-03",
    recordedBy: "usr-03",
    recordedByName: "Ahmad Fauzi",
    type: "OUT",
    amount: 500000,
    description: "Setoran kas tengah hari ke brankas toko",
    createdAt: "2026-11-04T18:00:00.000Z",
  },
  {
    id: "cm-008",
    shiftId: "shift-04",
    recordedBy: "usr-04",
    recordedByName: "Dewi Lestari",
    type: "OUT",
    amount: 25000,
    description: "Beli plastik takeaway & sedotan ramah lingkungan",
    createdAt: "2026-11-04T10:30:00.000Z",
  },
  {
    id: "cm-009",
    shiftId: "shift-05",
    recordedBy: "usr-01",
    recordedByName: "Siti Rahma",
    type: "IN",
    amount: 200000,
    description: "Pengembalian dana titipan operasional",
    createdAt: "2026-11-03T16:20:00.000Z",
  },
  {
    id: "cm-010",
    shiftId: "shift-06",
    recordedBy: "usr-02",
    recordedByName: "Budi Santoso",
    type: "OUT",
    amount: 75000,
    description: "Beli sabun cuci piring & tissue dapur",
    createdAt: "2026-11-03T09:10:00.000Z",
  },
];

export const mapBackendCashMovement = (
  item: BackendCashMovement,
  userMap?: Map<string, string>
): CashMovementItem => {
  return {
    id: item.id,
    shiftId: item.shiftId,
    recordedBy: item.recordedBy,
    recordedByName: userMap?.get(item.recordedBy) || item.username || "Kasir",
    type: item.type,
    amount: Number(item.amount) || 0,
    description: item.description || "-",
    createdAt: item.createdAt,
  };
};

export const calculateCashSummary = (
  items: CashMovementItem[],
  backendData?: BackendCashReportResponse
): CashReportSummary => {
  if (backendData?.cashIn !== undefined && backendData?.cashOut !== undefined) {
    const totalCashIn = Number(backendData.cashIn) || 0;
    const totalCashOut = Number(backendData.cashOut) || 0;
    const netCashFlow =
      backendData.netCashFlow !== undefined
        ? Number(backendData.netCashFlow)
        : totalCashIn - totalCashOut;
    const inCount =
      backendData.inCount !== undefined
        ? Number(backendData.inCount)
        : items.filter((m) => m.type === "IN").length;
    const outCount =
      backendData.outCount !== undefined
        ? Number(backendData.outCount)
        : items.filter((m) => m.type === "OUT").length;
    const totalCount =
      backendData.totalCount !== undefined
        ? Number(backendData.totalCount)
        : items.length;

    return {
      totalCashIn,
      totalCashOut,
      netCashFlow,
      totalCount,
      inCount,
      outCount,
    };
  }

  const totalCashIn = items
    .filter((m) => m.type === "IN")
    .reduce((sum, m) => sum + m.amount, 0);

  const totalCashOut = items
    .filter((m) => m.type === "OUT")
    .reduce((sum, m) => sum + m.amount, 0);

  const netCashFlow = totalCashIn - totalCashOut;
  const inCount = items.filter((m) => m.type === "IN").length;
  const outCount = items.filter((m) => m.type === "OUT").length;

  return {
    totalCashIn,
    totalCashOut,
    netCashFlow,
    totalCount: items.length,
    inCount,
    outCount,
  };
};

export const SAMPLE_CASH_SUMMARY: CashReportSummary = calculateCashSummary(
  SAMPLE_CASH_MOVEMENTS
);
