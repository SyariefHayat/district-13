export interface SalesReportItem {
  id: string;
  transactionNumber: string;
  shiftId: string;
  userId: string;
  cashierName?: string;
  subtotalAmount: number;
  discountAmount: number;
  discountReason?: string | null;
  totalAmount: number;
  paymentMethod: "CASH" | "QRIS" | string;
  paidAmount: number;
  changeAmount: number;
  status: "COMPLETED" | "VOIDED" | string;
  createdAt: string;
  items?: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotalAmount: number;
  }[];
}

export interface SalesReportPaymentSummary {
  paymentMethod: string;
  gross: number;
  discount: number;
  net: number;
  count: number;
}

export interface SalesReportSummary {
  grossSales: number;
  discountTotal: number;
  netSales: number;
  transactionCount: number;
  averageTransactionValue: number;
  byPaymentMethod: SalesReportPaymentSummary[];
}

export interface BackendSalesReportResponse {
  grossSales: string | number;
  discountTotal: string | number;
  netSales: string | number;
  transactionCount: number;
  averageTransactionValue: string | number;
  byPaymentMethod: Array<{
    paymentMethod: string;
    gross: string | number;
    discount: string | number;
    net: string | number;
    count: string | number;
  }>;
  transactions: {
    data: Array<{
      id: string;
      transactionNumber: string;
      shiftId: string;
      userId: string;
      subtotalAmount: string | number;
      discountAmount: string | number;
      totalAmount: string | number;
      paymentMethod: string;
      paidAmount: string | number;
      changeAmount: string | number;
      status: string;
      createdAt: string;
    }>;
    page: number;
    limit: number;
    total: number;
  };
}

export const formatIDR = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatReportDate = (dateStr: string): string => {
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

export const formatReportTime = (dateStr: string): string => {
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

export const formatReportDateOnly = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const SAMPLE_SALES_REPORT_TRANSACTIONS: SalesReportItem[] = [
  {
    id: "tx-001",
    transactionNumber: "TRX-20261105-001",
    shiftId: "shift-01",
    userId: "usr-01",
    cashierName: "Siti Rahma",
    subtotalAmount: 75000,
    discountAmount: 5000,
    discountReason: "Voucher Welcome",
    totalAmount: 70000,
    paymentMethod: "CASH",
    paidAmount: 100000,
    changeAmount: 30000,
    status: "COMPLETED",
    createdAt: "2026-11-05T08:15:00.000Z",
    items: [
      {
        id: "item-1",
        productName: "Kopi Susu Aren",
        quantity: 2,
        unitPrice: 25000,
        subtotalAmount: 50000,
      },
      {
        id: "item-2",
        productName: "Butter Croissant",
        quantity: 1,
        unitPrice: 25000,
        subtotalAmount: 25000,
      },
    ],
  },
  {
    id: "tx-002",
    transactionNumber: "TRX-20261105-002",
    shiftId: "shift-01",
    userId: "usr-02",
    cashierName: "Budi Santoso",
    subtotalAmount: 120000,
    discountAmount: 15000,
    discountReason: "Promo Member",
    totalAmount: 105000,
    paymentMethod: "QRIS",
    paidAmount: 105000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: "2026-11-05T08:42:00.000Z",
    items: [
      {
        id: "item-3",
        productName: "Caramel Macchiato",
        quantity: 2,
        unitPrice: 35000,
        subtotalAmount: 70000,
      },
      {
        id: "item-4",
        productName: "Tuna Melt Sandwich",
        quantity: 1,
        unitPrice: 50000,
        subtotalAmount: 50000,
      },
    ],
  },
  {
    id: "tx-003",
    transactionNumber: "TRX-20261105-003",
    shiftId: "shift-01",
    userId: "usr-01",
    cashierName: "Siti Rahma",
    subtotalAmount: 45000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 45000,
    paymentMethod: "CASH",
    paidAmount: 50000,
    changeAmount: 5000,
    status: "COMPLETED",
    createdAt: "2026-11-05T09:10:00.000Z",
    items: [
      {
        id: "item-5",
        productName: "Iced Americano",
        quantity: 1,
        unitPrice: 25000,
        subtotalAmount: 25000,
      },
      {
        id: "item-6",
        productName: "Cinnamon Roll",
        quantity: 1,
        unitPrice: 20000,
        subtotalAmount: 20000,
      },
    ],
  },
  {
    id: "tx-004",
    transactionNumber: "TRX-20261105-004",
    shiftId: "shift-01",
    userId: "usr-03",
    cashierName: "Ahmad Fauzi",
    subtotalAmount: 185000,
    discountAmount: 20000,
    discountReason: "Paket Sarapan Hemat",
    totalAmount: 165000,
    paymentMethod: "QRIS",
    paidAmount: 165000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: "2026-11-05T09:35:00.000Z",
    items: [
      {
        id: "item-7",
        productName: "Cafe Latte",
        quantity: 3,
        unitPrice: 35000,
        subtotalAmount: 105000,
      },
      {
        id: "item-8",
        productName: "Beef Puff Pastry",
        quantity: 2,
        unitPrice: 40000,
        subtotalAmount: 80000,
      },
    ],
  },
  {
    id: "tx-005",
    transactionNumber: "TRX-20261105-005",
    shiftId: "shift-01",
    userId: "usr-04",
    cashierName: "Dewi Lestari",
    subtotalAmount: 35000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 35000,
    paymentMethod: "QRIS",
    paidAmount: 35000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: "2026-11-05T10:05:00.000Z",
    items: [
      {
        id: "item-9",
        productName: "Matcha Latte",
        quantity: 1,
        unitPrice: 35000,
        subtotalAmount: 35000,
      },
    ],
  },
  {
    id: "tx-006",
    transactionNumber: "TRX-20261105-006",
    shiftId: "shift-01",
    userId: "usr-02",
    cashierName: "Budi Santoso",
    subtotalAmount: 65000,
    discountAmount: 10000,
    discountReason: "Kompensasi",
    totalAmount: 55000,
    paymentMethod: "CASH",
    paidAmount: 60000,
    changeAmount: 5000,
    status: "VOIDED",
    createdAt: "2026-11-05T10:20:00.000Z",
    items: [
      {
        id: "item-10",
        productName: "Kopi Tubruk Nusantara",
        quantity: 2,
        unitPrice: 20000,
        subtotalAmount: 40000,
      },
      {
        id: "item-11",
        productName: "Pisang Goreng Madu",
        quantity: 1,
        unitPrice: 25000,
        subtotalAmount: 25000,
      },
    ],
  },
  {
    id: "tx-007",
    transactionNumber: "TRX-20261104-012",
    shiftId: "shift-02",
    userId: "usr-03",
    cashierName: "Ahmad Fauzi",
    subtotalAmount: 210000,
    discountAmount: 25000,
    discountReason: "Voucher Diskon Spesial",
    totalAmount: 185000,
    paymentMethod: "CASH",
    paidAmount: 200000,
    changeAmount: 15000,
    status: "COMPLETED",
    createdAt: "2026-11-04T14:15:00.000Z",
    items: [
      {
        id: "item-12",
        productName: "Manual Brew V60",
        quantity: 3,
        unitPrice: 40000,
        subtotalAmount: 120000,
      },
      {
        id: "item-13",
        productName: "Chocolate Fudge Cake",
        quantity: 3,
        unitPrice: 30000,
        subtotalAmount: 90000,
      },
    ],
  },
  {
    id: "tx-008",
    transactionNumber: "TRX-20261104-013",
    shiftId: "shift-02",
    userId: "usr-01",
    cashierName: "Siti Rahma",
    subtotalAmount: 80000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 80000,
    paymentMethod: "QRIS",
    paidAmount: 80000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: "2026-11-04T16:50:00.000Z",
    items: [
      {
        id: "item-14",
        productName: "Avocado Coffee Float",
        quantity: 2,
        unitPrice: 40000,
        subtotalAmount: 80000,
      },
    ],
  },
  {
    id: "tx-009",
    transactionNumber: "TRX-20261104-014",
    shiftId: "shift-02",
    userId: "usr-04",
    cashierName: "Dewi Lestari",
    subtotalAmount: 95000,
    discountAmount: 10000,
    discountReason: "Promo Pelajar",
    totalAmount: 85000,
    paymentMethod: "CASH",
    paidAmount: 100000,
    changeAmount: 15000,
    status: "COMPLETED",
    createdAt: "2026-11-04T18:30:00.000Z",
    items: [
      {
        id: "item-15",
        productName: "Signature Milk Tea",
        quantity: 2,
        unitPrice: 30000,
        subtotalAmount: 60000,
      },
      {
        id: "item-16",
        productName: "Cheesy French Fries",
        quantity: 1,
        unitPrice: 35000,
        subtotalAmount: 35000,
      },
    ],
  },
  {
    id: "tx-010",
    transactionNumber: "TRX-20261103-008",
    shiftId: "shift-01",
    userId: "usr-02",
    cashierName: "Budi Santoso",
    subtotalAmount: 150000,
    discountAmount: 15000,
    discountReason: "Diskon Happy Hour",
    totalAmount: 135000,
    paymentMethod: "QRIS",
    paidAmount: 135000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: "2026-11-03T11:20:00.000Z",
    items: [
      {
        id: "item-17",
        productName: "Cold Brew Lemonade",
        quantity: 3,
        unitPrice: 35000,
        subtotalAmount: 105000,
      },
      {
        id: "item-18",
        productName: "Belgian Butter Waffle",
        quantity: 1,
        unitPrice: 45000,
        subtotalAmount: 45000,
      },
    ],
  },
];

export const SAMPLE_SALES_REPORT_SUMMARY: SalesReportSummary = {
  grossSales: 995000,
  discountTotal: 90000,
  netSales: 905000,
  transactionCount: 9,
  averageTransactionValue: 100556,
  byPaymentMethod: [
    {
      paymentMethod: "CASH",
      gross: 425000,
      discount: 40000,
      net: 385000,
      count: 4,
    },
    {
      paymentMethod: "QRIS",
      gross: 570000,
      discount: 50000,
      net: 520000,
      count: 5,
    },
  ],
};

export const INITIAL_SUMMARY: SalesReportSummary = SAMPLE_SALES_REPORT_SUMMARY;
