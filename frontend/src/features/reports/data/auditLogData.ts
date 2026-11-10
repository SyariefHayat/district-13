export interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogSummary {
  totalLogs: number;
  securityEvents: number;
  transactionEvents: number;
  dataChangeEvents: number;
}

export const SAMPLE_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "log-001",
    userId: "usr-01",
    userName: "Ahmad Fauzi",
    userRole: "Senior Cashier",
    action: "TRANSACTION_CREATED",
    entityType: "TRANSACTION",
    entityId: "trx-20261105-001",
    description:
      "Membuat transaksi tunai baru #TRX-20261105-001 senilai Rp 75.000",
    metadata: {
      transactionNumber: "TRX-20261105-001",
      paymentMethod: "CASH",
      totalAmount: 75000,
      itemCount: 2,
    },
    ipAddress: "192.168.1.101",
    createdAt: "2026-11-05 13:45:12",
  },
  {
    id: "log-002",
    userId: "usr-05",
    userName: "Dian Pratama",
    userRole: "Kasir Malam",
    action: "TRANSACTION_VOIDED",
    entityType: "TRANSACTION",
    entityId: "trx-20261105-002",
    description:
      "Membatalkan nota #TRX-20261105-002 senilai Rp 120.000 karena salah input",
    metadata: {
      transactionNumber: "TRX-20261105-002",
      voidReason: "Salah input varian pelanggan",
      authorizedBy: "SPV-Budi",
      amountRefunded: 120000,
    },
    ipAddress: "192.168.1.105",
    createdAt: "2026-11-05 13:20:05",
  },
  {
    id: "log-003",
    userId: "usr-02",
    userName: "Siti Rahma",
    userRole: "Kasir Utama",
    action: "SHIFT_OPENED",
    entityType: "SHIFT",
    entityId: "shf-20261105-01",
    description: "Membuka shift kasir pagi dengan modal kas awal Rp 200.000",
    metadata: {
      openingCash: 200000,
      shiftType: "PAGI",
      posTerminal: "POS-01",
    },
    ipAddress: "192.168.1.102",
    createdAt: "2026-11-05 07:00:15",
  },
  {
    id: "log-004",
    userId: "usr-03",
    userName: "Budi Santoso",
    userRole: "Supervisor",
    action: "CASH_MOVEMENT_OUT_RECORDED",
    entityType: "CASH_MOVEMENT",
    entityId: "cm-004",
    description: "Mencatat kas keluar operasional pembelian gas LPG Rp 48.000",
    metadata: {
      type: "OUT",
      category: "OPERATIONAL",
      amount: 48000,
      recipient: "Toko Berkah",
    },
    ipAddress: "192.168.1.103",
    createdAt: "2026-11-05 10:15:22",
  },
  {
    id: "log-005",
    userId: "usr-admin",
    userName: "Syarief (Admin)",
    userRole: "Administrator",
    action: "PRODUCT_UPDATED",
    entityType: "PRODUCT",
    entityId: "prd-001",
    description:
      "Memperbarui harga jual Kopi Susu Gula Aren dari Rp 18.000 menjadi Rp 20.000",
    metadata: {
      productName: "Kopi Susu Gula Aren",
      sku: "KOP-SUSU-001",
      oldPrice: 18000,
      newPrice: 20000,
    },
    ipAddress: "192.168.1.10",
    createdAt: "2026-11-05 09:30:40",
  },
  {
    id: "log-006",
    userId: "usr-admin",
    userName: "Syarief (Admin)",
    userRole: "Administrator",
    action: "INVENTORY_STOCK_IN",
    entityType: "INVENTORY",
    entityId: "inv-001",
    description:
      "Restock biji kopi Arabica House Blend sebanyak 10.000 gram ke Gudang Utama",
    metadata: {
      item: "Arabica House Blend Beans",
      quantity: 10000,
      unit: "gram",
      supplier: "CV Kopi Nusantara",
    },
    ipAddress: "192.168.1.10",
    createdAt: "2026-11-05 08:45:00",
  },
  {
    id: "log-007",
    userId: "usr-04",
    userName: "Rina Wulandari",
    userRole: "Kasir Pagi",
    action: "AUTH_LOGIN_SUCCEEDED",
    entityType: "SESSION",
    entityId: "ses-007",
    description: "Login berhasil ke terminal POS melalui otentikasi PIN",
    metadata: {
      terminal: "POS-02",
      authMethod: "PIN",
    },
    ipAddress: "192.168.1.104",
    createdAt: "2026-11-05 06:55:10",
  },
  {
    id: "log-008",
    userId: "usr-06",
    userName: "Fajar Nugraha",
    userRole: "Junior Cashier",
    action: "AUTH_LOGIN_FAILED",
    entityType: "SESSION",
    entityId: null,
    description: "Percobaan login gagal dengan PIN salah sebanyak 2 kali",
    metadata: {
      terminal: "POS-01",
      reason: "INVALID_CREDENTIALS",
      attempts: 2,
    },
    ipAddress: "192.168.1.101",
    createdAt: "2026-11-04 15:45:00",
  },
  {
    id: "log-009",
    userId: "usr-03",
    userName: "Budi Santoso",
    userRole: "Supervisor",
    action: "SHIFT_CLOSED_BY_SUPERVISOR",
    entityType: "SHIFT",
    entityId: "shf-20261104-02",
    description:
      "Otorisasi penutupan shift kasir malam dengan selisih kas minus Rp 40.000",
    metadata: {
      shiftId: "shf-20261104-02",
      cashierName: "Budi Santoso",
      cashExpected: 6400000,
      cashActual: 6360000,
      difference: -40000,
    },
    ipAddress: "192.168.1.103",
    createdAt: "2026-11-04 22:05:18",
  },
  {
    id: "log-010",
    userId: "usr-admin",
    userName: "Syarief (Admin)",
    userRole: "Administrator",
    action: "USER_ROLE_CHANGED",
    entityType: "USER",
    entityId: "usr-01",
    description: "Mengubah jabatan pengguna Ahmad Fauzi menjadi Senior Cashier",
    metadata: {
      targetUser: "Ahmad Fauzi",
      oldRole: "CASHIER",
      newRole: "SENIOR_CASHIER",
    },
    ipAddress: "192.168.1.10",
    createdAt: "2026-11-03 11:20:00",
  },
];

export interface BackendAuditLog {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export function mapBackendAuditLog(item: BackendAuditLog): AuditLogItem {
  const meta = item.metadata || {};
  return {
    id: item.id,
    userId: item.userId,
    userName:
      item.username ||
      (typeof meta.userName === "string" ? meta.userName : "") ||
      (typeof meta.username === "string" ? meta.username : "") ||
      (typeof meta.cashierName === "string" ? meta.cashierName : "") ||
      "Sistem",
    userRole:
      (typeof meta.userRole === "string" ? meta.userRole : undefined) ||
      (typeof meta.role === "string" ? meta.role : undefined),
    action: item.action,
    entityType: item.entityType,
    entityId: item.entityId,
    description: item.description,
    metadata: item.metadata,
    ipAddress:
      (typeof meta.ipAddress === "string" ? meta.ipAddress : undefined) ||
      (typeof meta.ip === "string" ? meta.ip : undefined) ||
      "-",
    createdAt: item.createdAt,
  };
}

export function calculateAuditLogSummary(
  logs: AuditLogItem[],
  totalOverride?: number
): AuditLogSummary {
  let securityEvents = 0;
  let transactionEvents = 0;
  let dataChangeEvents = 0;

  for (const log of logs) {
    if (log.action.startsWith("AUTH_") || log.entityType === "SESSION") {
      securityEvents++;
    } else if (
      log.action.startsWith("TRANSACTION") ||
      log.action.startsWith("SHIFT") ||
      log.action.startsWith("CASH") ||
      ["TRANSACTION", "SHIFT", "CASH_MOVEMENT"].includes(log.entityType)
    ) {
      transactionEvents++;
    } else if (
      log.action.startsWith("PRODUCT") ||
      log.action.startsWith("CATEGORY") ||
      log.action.startsWith("ADDON") ||
      log.action.startsWith("INVENTORY") ||
      log.action.startsWith("USER") ||
      log.action.startsWith("SCHEDULE") ||
      [
        "PRODUCT",
        "CATEGORY",
        "ADDON",
        "INVENTORY",
        "USER",
        "SCHEDULE",
      ].includes(log.entityType)
    ) {
      dataChangeEvents++;
    }
  }

  return {
    totalLogs: totalOverride !== undefined ? totalOverride : logs.length,
    securityEvents,
    transactionEvents,
    dataChangeEvents,
  };
}

export const SAMPLE_AUDIT_LOG_SUMMARY: AuditLogSummary = {
  totalLogs: 0,
  securityEvents: 0,
  transactionEvents: 0,
  dataChangeEvents: 0,
};
