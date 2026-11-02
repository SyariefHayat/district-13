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

const now = new Date();
const setTime = (daysAgo: number, hour: number, minute: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const INITIAL_MOCK_TRANSACTIONS: SaleTransaction[] = [
  // Today - Morning / Afternoon
  {
    id: "tx-mock-001",
    transactionNumber: "TRX-20261101-0001",
    shiftId: "shift-01",
    userId: "usr-01",
    cashierName: "Ahmad Rizki",
    subtotalAmount: 48000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 48000,
    paymentMethod: "QRIS",
    paidAmount: 48000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: setTime(0, 8, 15), // Today 08:15 Morning
    items: [
      {
        id: "item-01",
        transactionId: "tx-mock-001",
        productId: "p-01",
        productName: "Signature Latte",
        quantity: 2,
        unitPrice: 24000,
        subtotalAmount: 48000,
      },
    ],
  },
  {
    id: "tx-mock-002",
    transactionNumber: "TRX-20261101-0002",
    shiftId: "shift-01",
    userId: "usr-01",
    cashierName: "Ahmad Rizki",
    subtotalAmount: 65000,
    discountAmount: 5000,
    discountReason: "Promo Member Gold",
    totalAmount: 60000,
    paymentMethod: "CASH",
    paidAmount: 100000,
    changeAmount: 40000,
    status: "COMPLETED",
    createdAt: setTime(0, 10, 45), // Today 10:45 Morning
    items: [
      {
        id: "item-02",
        transactionId: "tx-mock-002",
        productId: "p-02",
        productName: "Croissant Almond",
        quantity: 1,
        unitPrice: 28000,
        subtotalAmount: 28000,
      },
      {
        id: "item-03",
        transactionId: "tx-mock-002",
        productId: "p-03",
        productName: "Caramel Macchiato",
        quantity: 1,
        unitPrice: 32000,
        subtotalAmount: 32000,
        addons: [
          {
            id: "ad-01",
            transactionItemId: "item-03",
            addonId: "addon-01",
            addonName: "Extra Shot Espresso",
            unitPrice: 5000,
            quantity: 1,
          },
        ],
      },
    ],
  },
  {
    id: "tx-mock-003",
    transactionNumber: "TRX-20261101-0003",
    shiftId: "shift-01",
    userId: "usr-02",
    cashierName: "Siti Nurhaliza",
    subtotalAmount: 35000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 35000,
    paymentMethod: "CASH",
    paidAmount: 50000,
    changeAmount: 15000,
    status: "VOIDED",
    voidedBy: "usr-02",
    voidedAt: setTime(0, 11, 20),
    voidReason: "Salah input pesanan pelanggan",
    createdAt: setTime(0, 11, 15), // Today 11:15 Morning
    items: [
      {
        id: "item-04",
        transactionId: "tx-mock-003",
        productId: "p-04",
        productName: "Americano Cold Brew",
        quantity: 1,
        unitPrice: 35000,
        subtotalAmount: 35000,
      },
    ],
  },
  {
    id: "tx-mock-004",
    transactionNumber: "TRX-20261101-0004",
    shiftId: "shift-01",
    userId: "usr-02",
    cashierName: "Siti Nurhaliza",
    subtotalAmount: 76000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 76000,
    paymentMethod: "QRIS",
    paidAmount: 76000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: setTime(0, 13, 30), // Today 13:30 Afternoon
    items: [
      {
        id: "item-05",
        transactionId: "tx-mock-004",
        productId: "p-05",
        productName: "Matcha Fusion Latte",
        quantity: 2,
        unitPrice: 28000,
        subtotalAmount: 56000,
      },
      {
        id: "item-06",
        transactionId: "tx-mock-004",
        productId: "p-06",
        productName: "Pain au Chocolat",
        quantity: 1,
        unitPrice: 20000,
        subtotalAmount: 20000,
      },
    ],
  },
  {
    id: "tx-mock-005",
    transactionNumber: "TRX-20261101-0005",
    shiftId: "shift-01",
    userId: "usr-03",
    cashierName: "Budi Santoso",
    subtotalAmount: 92000,
    discountAmount: 10000,
    discountReason: "Voucher Diskon Siang",
    totalAmount: 82000,
    paymentMethod: "QRIS",
    paidAmount: 82000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: setTime(0, 15, 45), // Today 15:45 Afternoon
    items: [
      {
        id: "item-07",
        transactionId: "tx-mock-005",
        productId: "p-07",
        productName: "Avocado Toast with Egg",
        quantity: 1,
        unitPrice: 42000,
        subtotalAmount: 42000,
      },
      {
        id: "item-08",
        transactionId: "tx-mock-005",
        productId: "p-01",
        productName: "Signature Latte",
        quantity: 2,
        unitPrice: 25000,
        subtotalAmount: 50000,
      },
    ],
  },
  {
    id: "tx-mock-006",
    transactionNumber: "TRX-20261101-0006",
    shiftId: "shift-02",
    userId: "usr-03",
    cashierName: "Budi Santoso",
    subtotalAmount: 42000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 42000,
    paymentMethod: "CASH",
    paidAmount: 50000,
    changeAmount: 8000,
    status: "COMPLETED",
    createdAt: setTime(0, 19, 10), // Today 19:10 Night
    items: [
      {
        id: "item-09",
        transactionId: "tx-mock-006",
        productId: "p-08",
        productName: "Double Espresso",
        quantity: 1,
        unitPrice: 22000,
        subtotalAmount: 22000,
      },
      {
        id: "item-10",
        transactionId: "tx-mock-006",
        productId: "p-06",
        productName: "Pain au Chocolat",
        quantity: 1,
        unitPrice: 20000,
        subtotalAmount: 20000,
      },
    ],
  },

  // Yesterday
  {
    id: "tx-mock-007",
    transactionNumber: "TRX-20261031-0007",
    shiftId: "shift-02",
    userId: "usr-04",
    cashierName: "Dewi Lestari",
    subtotalAmount: 55000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 55000,
    paymentMethod: "QRIS",
    paidAmount: 55000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: setTime(1, 14, 20), // Yesterday 14:20
    items: [
      {
        id: "item-11",
        transactionId: "tx-mock-007",
        productId: "p-10",
        productName: "Caffe Mocha Float",
        quantity: 1,
        unitPrice: 35000,
        subtotalAmount: 35000,
      },
      {
        id: "item-12",
        transactionId: "tx-mock-007",
        productId: "p-06",
        productName: "Pain au Chocolat",
        quantity: 1,
        unitPrice: 20000,
        subtotalAmount: 20000,
      },
    ],
  },
  {
    id: "tx-mock-008",
    transactionNumber: "TRX-20261031-0008",
    shiftId: "shift-02",
    userId: "usr-04",
    cashierName: "Dewi Lestari",
    subtotalAmount: 45000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 45000,
    paymentMethod: "CASH",
    paidAmount: 50000,
    changeAmount: 5000,
    status: "VOIDED",
    voidedBy: "usr-04",
    voidedAt: setTime(1, 17, 30),
    voidReason: "Pelanggan membatalkan pesanan karena terburu-buru",
    createdAt: setTime(1, 17, 15), // Yesterday 17:15
    items: [
      {
        id: "item-13",
        transactionId: "tx-mock-008",
        productId: "p-03",
        productName: "Caramel Macchiato",
        quantity: 1,
        unitPrice: 35000,
        subtotalAmount: 35000,
      },
      {
        id: "item-14",
        transactionId: "tx-mock-008",
        productId: "p-11",
        productName: "Cheese Danish",
        quantity: 1,
        unitPrice: 10000,
        subtotalAmount: 10000,
      },
    ],
  },

  // 3 Days Ago (Within last 7 days)
  {
    id: "tx-mock-009",
    transactionNumber: "TRX-20261029-0009",
    shiftId: "shift-02",
    userId: "usr-01",
    cashierName: "Ahmad Rizki",
    subtotalAmount: 110000,
    discountAmount: 15000,
    discountReason: "Paket Bundle Coffee & Bakery",
    totalAmount: 95000,
    paymentMethod: "QRIS",
    paidAmount: 95000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: setTime(3, 11, 40),
    items: [
      {
        id: "item-15",
        transactionId: "tx-mock-009",
        productId: "p-01",
        productName: "Signature Latte",
        quantity: 2,
        unitPrice: 24000,
        subtotalAmount: 48000,
      },
      {
        id: "item-16",
        transactionId: "tx-mock-009",
        productId: "p-02",
        productName: "Croissant Almond",
        quantity: 2,
        unitPrice: 28000,
        subtotalAmount: 56000,
      },
    ],
  },

  // 5 Days Ago (Within last 7 days)
  {
    id: "tx-mock-010",
    transactionNumber: "TRX-20261027-0010",
    shiftId: "shift-02",
    userId: "usr-02",
    cashierName: "Siti Nurhaliza",
    subtotalAmount: 26000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 26000,
    paymentMethod: "CASH",
    paidAmount: 30000,
    changeAmount: 4000,
    status: "COMPLETED",
    createdAt: setTime(5, 16, 50),
    items: [
      {
        id: "item-18",
        transactionId: "tx-mock-010",
        productId: "p-13",
        productName: "Earl Grey Artisan Tea",
        quantity: 1,
        unitPrice: 26000,
        subtotalAmount: 26000,
      },
    ],
  },

  // 12 Days Ago (Within this month)
  {
    id: "tx-mock-011",
    transactionNumber: "TRX-20261020-0011",
    shiftId: "shift-02",
    userId: "usr-03",
    cashierName: "Budi Santoso",
    subtotalAmount: 85000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 85000,
    paymentMethod: "QRIS",
    paidAmount: 85000,
    changeAmount: 0,
    status: "COMPLETED",
    createdAt: setTime(12, 10, 15),
    items: [
      {
        id: "item-19",
        transactionId: "tx-mock-011",
        productId: "p-07",
        productName: "Avocado Toast with Egg",
        quantity: 1,
        unitPrice: 42000,
        subtotalAmount: 42000,
      },
      {
        id: "item-20",
        transactionId: "tx-mock-011",
        productId: "p-05",
        productName: "Matcha Fusion Latte",
        quantity: 1,
        unitPrice: 28000,
        subtotalAmount: 28000,
      },
      {
        id: "item-21",
        transactionId: "tx-mock-011",
        productId: "p-14",
        productName: "Cinnamon Roll",
        quantity: 1,
        unitPrice: 15000,
        subtotalAmount: 15000,
      },
    ],
  },

  // 40 Days Ago (Earlier / Past month)
  {
    id: "tx-mock-012",
    transactionNumber: "TRX-20260922-0012",
    shiftId: "shift-02",
    userId: "usr-04",
    cashierName: "Dewi Lestari",
    subtotalAmount: 38000,
    discountAmount: 0,
    discountReason: null,
    totalAmount: 38000,
    paymentMethod: "CASH",
    paidAmount: 50000,
    changeAmount: 12000,
    status: "COMPLETED",
    createdAt: setTime(40, 9, 30),
    items: [
      {
        id: "item-22",
        transactionId: "tx-mock-012",
        productId: "p-04",
        productName: "Americano Cold Brew",
        quantity: 1,
        unitPrice: 38000,
        subtotalAmount: 38000,
      },
    ],
  },
];
