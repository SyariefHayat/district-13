import {
  IconBox,
  IconLayoutDashboard,
  IconPackage,
  IconReceipt,
  IconReportAnalytics,
  IconUsers,
} from "@tabler/icons-react";

export const dashboardMenu = [
  {
    title: "Ringkasan",
    url: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    title: "Manajemen Produk",
    icon: IconPackage,
    items: [
      { title: "Produk", url: "/dashboard/products" },
      { title: "Varian / Tambahan", url: "/dashboard/addons" },
    ],
  },
  {
    title: "Manajemen Stok",
    icon: IconBox,
    items: [
      { title: "Stok Gudang", url: "/dashboard/stocks" },
      { title: "Stok Etalase", url: "/dashboard/stocks" },
      { title: "Perpindahan Stok", url: "/dashboard/stocks" },
    ],
  },
  {
    title: "Manajemen Karyawan",
    icon: IconUsers,
    items: [
      { title: "Karyawan", url: "/dashboard/users" },
      { title: "Jadwal Shift", url: "/dashboard/schedules" },
    ],
  },
  {
    title: "Transaksi",
    icon: IconReceipt,
    items: [
      { title: "Penjualan", url: "/dashboard/transactions" },
      { title: "Diskon", url: "/dashboard/discounts" },
      { title: "Metode Pembayaran", url: "/dashboard/payments" },
    ],
  },
  {
    title: "Laporan & Audit",
    icon: IconReportAnalytics,
    items: [
      { title: "Laporan Penjualan", url: "/dashboard/reports" },
      { title: "Laporan Shift", url: "/dashboard/shifts" },
      { title: "Kas Masuk & Keluar", url: "/dashboard/cash" },
      { title: "Analitik Profit", url: "/dashboard/profit" },
      { title: "Audit Kasir", url: "/dashboard/cashiers" },
      { title: "Audit Log", url: "/dashboard/audits" },
    ],
  },
] as const;
