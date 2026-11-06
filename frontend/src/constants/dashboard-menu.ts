import {
  IconBox,
  IconLayoutDashboard,
  IconPackage,
  IconReceipt,
  IconReportAnalytics,
  IconUsers,
} from "@tabler/icons-react";

export type RoleType = "OWNER" | "ADMIN" | "CASHIER";

export interface MenuItemSingle {
  title: string;
  url: string;
  icon: any;
  roles?: readonly RoleType[];
}

export interface MenuItemWithSub {
  title: string;
  icon: any;
  roles?: readonly RoleType[];
  items: readonly {
    title: string;
    url: string;
    roles?: readonly RoleType[];
  }[];
}

export type MenuItem = MenuItemSingle | MenuItemWithSub;

export const dashboardMenu: readonly MenuItem[] = [
  {
    title: "Ringkasan",
    url: "/dashboard",
    icon: IconLayoutDashboard,
    roles: ["OWNER", "ADMIN", "CASHIER"],
  },
  {
    title: "Manajemen Produk",
    icon: IconPackage,
    roles: ["OWNER", "ADMIN", "CASHIER"],
    items: [
      {
        title: "Produk",
        url: "/dashboard/products",
        roles: ["OWNER", "ADMIN", "CASHIER"],
      },
      {
        title: "Add-ons",
        url: "/dashboard/addons",
        roles: ["OWNER", "ADMIN", "CASHIER"],
      },
    ],
  },
  {
    title: "Manajemen Stok",
    icon: IconBox,
    roles: ["OWNER", "ADMIN"],
    items: [
      {
        title: "Inventori & Stok",
        url: "/dashboard/stocks",
        roles: ["OWNER", "ADMIN"],
      },
      {
        title: "Riwayat Perpindahan",
        url: "/dashboard/stocks/movements",
        roles: ["OWNER", "ADMIN"],
      },
    ],
  },
  {
    title: "Manajemen Karyawan",
    icon: IconUsers,
    roles: ["OWNER", "ADMIN", "CASHIER"],
    items: [
      { title: "Karyawan", url: "/dashboard/users", roles: ["OWNER", "ADMIN"] },
      {
        title: "Jadwal Shift",
        url: "/dashboard/schedules",
        roles: ["OWNER", "ADMIN", "CASHIER"],
      },
    ],
  },
  {
    title: "Transaksi",
    icon: IconReceipt,
    roles: ["OWNER", "ADMIN", "CASHIER"],
    items: [
      {
        title: "Penjualan",
        url: "/dashboard/transactions",
        roles: ["OWNER", "ADMIN", "CASHIER"],
      },
      {
        title: "Diskon",
        url: "/dashboard/discounts",
        roles: ["OWNER", "ADMIN", "CASHIER"],
      },
      {
        title: "Metode Pembayaran",
        url: "/dashboard/payments",
        roles: ["OWNER", "ADMIN", "CASHIER"],
      },
    ],
  },
  {
    title: "Laporan & Audit",
    icon: IconReportAnalytics,
    roles: ["OWNER", "ADMIN"],
    items: [
      {
        title: "Laporan Penjualan",
        url: "/dashboard/reports",
        roles: ["OWNER", "ADMIN"],
      },
      {
        title: "Laporan Shift",
        url: "/dashboard/shifts",
        roles: ["OWNER", "ADMIN"],
      },
      {
        title: "Kas Masuk & Keluar",
        url: "/dashboard/cash",
        roles: ["OWNER", "ADMIN"],
      },
      {
        title: "Analitik Profit",
        url: "/dashboard/profit",
        roles: ["OWNER", "ADMIN"],
      },
      {
        title: "Audit Kasir",
        url: "/dashboard/cashiers",
        roles: ["OWNER", "ADMIN"],
      },
      {
        title: "Audit Log",
        url: "/dashboard/audits",
        roles: ["OWNER", "ADMIN"],
      },
    ],
  },
] as const;
