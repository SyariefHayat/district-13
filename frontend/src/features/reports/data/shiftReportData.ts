export interface ShiftReportItem {
  id: string;
  userId: string;
  username: string;
  cashierName?: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  expectedCash: number;
  closingCash: number | null;
  cashDifference: number | null;
  transactionCount: number;
  status: "OPEN" | "CLOSED";
}

export interface ShiftReportSummary {
  totalShifts: number;
  openShifts: number;
  closedShifts: number;
  totalClosingCash: number;
  totalCashDifference: number;
  totalTransactions: number;
}

export interface BackendShiftReportResponse {
  summary?: ShiftReportSummary;
  data: Array<{
    id: string;
    userId: string;
    username: string;
    openedAt: string;
    closedAt: string | null;
    openingCash: string | number;
    expectedCash: string | number;
    closingCash: string | number | null;
    cashDifference: string | number | null;
    transactionCount: number;
  }>;
  page: number;
  limit: number;
  total: number;
}

export const formatShiftDate = (dateStr: string | null): string => {
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

export const formatShiftTimeOnly = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const SAMPLE_SHIFT_REPORT_ITEMS: ShiftReportItem[] = [
  {
    id: "shift-01",
    userId: "usr-01",
    username: "sitirahma",
    cashierName: "Siti Rahma",
    openedAt: "2026-11-05T07:00:00.000Z",
    closedAt: null,
    openingCash: 300000,
    expectedCash: 750000,
    closingCash: null,
    cashDifference: null,
    transactionCount: 14,
    status: "OPEN",
  },
  {
    id: "shift-02",
    userId: "usr-02",
    username: "budisantoso",
    cashierName: "Budi Santoso",
    openedAt: "2026-11-05T07:30:00.000Z",
    closedAt: null,
    openingCash: 300000,
    expectedCash: 520000,
    closingCash: null,
    cashDifference: null,
    transactionCount: 9,
    status: "OPEN",
  },
  {
    id: "shift-03",
    userId: "usr-03",
    username: "ahmadfauzi",
    cashierName: "Ahmad Fauzi",
    openedAt: "2026-11-04T15:00:00.000Z",
    closedAt: "2026-11-04T23:15:00.000Z",
    openingCash: 300000,
    expectedCash: 1850000,
    closingCash: 1850000,
    cashDifference: 0,
    transactionCount: 38,
    status: "CLOSED",
  },
  {
    id: "shift-04",
    userId: "usr-04",
    username: "dewilestari",
    cashierName: "Dewi Lestari",
    openedAt: "2026-11-04T07:00:00.000Z",
    closedAt: "2026-11-04T15:30:00.000Z",
    openingCash: 300000,
    expectedCash: 1420000,
    closingCash: 1420000,
    cashDifference: 0,
    transactionCount: 29,
    status: "CLOSED",
  },
  {
    id: "shift-05",
    userId: "usr-01",
    username: "sitirahma",
    cashierName: "Siti Rahma",
    openedAt: "2026-11-03T15:00:00.000Z",
    closedAt: "2026-11-03T23:05:00.000Z",
    openingCash: 300000,
    expectedCash: 1680000,
    closingCash: 1675000,
    cashDifference: -5000,
    transactionCount: 34,
    status: "CLOSED",
  },
  {
    id: "shift-06",
    userId: "usr-02",
    username: "budisantoso",
    cashierName: "Budi Santoso",
    openedAt: "2026-11-03T07:00:00.000Z",
    closedAt: "2026-11-03T15:15:00.000Z",
    openingCash: 300000,
    expectedCash: 1250000,
    closingCash: 1250000,
    cashDifference: 0,
    transactionCount: 25,
    status: "CLOSED",
  },
  {
    id: "shift-07",
    userId: "usr-03",
    username: "ahmadfauzi",
    cashierName: "Ahmad Fauzi",
    openedAt: "2026-11-02T15:00:00.000Z",
    closedAt: "2026-11-02T23:10:00.000Z",
    openingCash: 300000,
    expectedCash: 1540000,
    closingCash: 1550000,
    cashDifference: 10000,
    transactionCount: 31,
    status: "CLOSED",
  },
  {
    id: "shift-08",
    userId: "usr-04",
    username: "dewilestari",
    cashierName: "Dewi Lestari",
    openedAt: "2026-11-02T07:00:00.000Z",
    closedAt: "2026-11-02T15:00:00.000Z",
    openingCash: 300000,
    expectedCash: 1390000,
    closingCash: 1390000,
    cashDifference: 0,
    transactionCount: 27,
    status: "CLOSED",
  },
];

export const mapBackendShiftReportItem = (
  s: BackendShiftReportResponse["data"][number],
  userMap?: Map<string, string>
): ShiftReportItem => ({
  id: s.id,
  userId: s.userId,
  username: s.username,
  cashierName: userMap?.get(s.userId) || s.username || "Kasir",
  openedAt: s.openedAt,
  closedAt: s.closedAt,
  openingCash: Number(s.openingCash) || 0,
  expectedCash: Number(s.expectedCash) || 0,
  closingCash:
    s.closingCash !== null && s.closingCash !== undefined
      ? Number(s.closingCash)
      : null,
  cashDifference:
    s.cashDifference !== null && s.cashDifference !== undefined
      ? Number(s.cashDifference)
      : null,
  transactionCount: Number(s.transactionCount) || 0,
  status: s.closedAt ? "CLOSED" : "OPEN",
});

export const calculateShiftSummary = (
  items: ShiftReportItem[],
  backendSummary?: ShiftReportSummary
): ShiftReportSummary => {
  if (backendSummary) {
    return backendSummary;
  }
  const totalShifts = items.length;
  const openShifts = items.filter((s) => s.status === "OPEN").length;
  const closedShifts = items.filter((s) => s.status === "CLOSED").length;
  const totalClosingCash = items.reduce(
    (sum, s) => sum + (s.closingCash ?? s.expectedCash ?? 0),
    0
  );
  const totalCashDifference = items.reduce(
    (sum, s) => sum + (s.cashDifference ?? 0),
    0
  );
  const totalTransactions = items.reduce(
    (sum, s) => sum + (s.transactionCount || 0),
    0
  );

  return {
    totalShifts,
    openShifts,
    closedShifts,
    totalClosingCash,
    totalCashDifference,
    totalTransactions,
  };
};

export const SAMPLE_SHIFT_REPORT_SUMMARY: ShiftReportSummary =
  calculateShiftSummary(SAMPLE_SHIFT_REPORT_ITEMS);
