import {
  IconAlertTriangle,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBox,
  IconCash,
  IconReceipt,
  IconReceiptOff,
  IconUsers,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR, type AdminMetrics } from "../data/adminData";

interface AdminStatsCardsProps {
  metrics: AdminMetrics;
  isLoading: boolean;
}

export function AdminStatsCards({ metrics, isLoading }: AdminStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:px-6">
      {/* 1. Today's Total Sales */}
      <Card className="border-l-4 border-l-primary shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Penjualan Hari Ini
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconReceipt className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {formatIDR(metrics.todaySales)}
          </div>
          <CardDescription className="text-xs text-muted-foreground flex flex-col gap-0.5">
            <span>{metrics.todayTransactions} total transaksi</span>
            <span className="text-[11px] text-muted-foreground/80">
              Cash: {formatIDR(metrics.cashSales)} • QRIS:{" "}
              {formatIDR(metrics.qrisSales)}
            </span>
          </CardDescription>
        </CardContent>
      </Card>

      {/* 2. Active Cashier Shifts */}
      <Card className="border-l-4 border-l-emerald-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Shift Kasir Aktif
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconUsers className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {metrics.activeShiftsCount} Register
            </span>
            {metrics.activeShiftsCount > 0 && (
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {metrics.activeShiftsCount > 0
              ? `${metrics.activeShiftsCount} kasir sedang bertugas saat ini`
              : "Tidak ada shift kasir yang sedang buka"}
          </CardDescription>
        </CardContent>
      </Card>

      {/* 3. Low Display Stock Alerts */}
      <Card
        className={`border-l-4 shadow-xs ${
          metrics.lowStockCount > 0
            ? "border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10"
            : "border-l-muted"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Stok Display Menipis
          </CardTitle>
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${
              metrics.lowStockCount > 0
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {metrics.lowStockCount > 0 ? (
              <IconAlertTriangle className="size-4" />
            ) : (
              <IconBox className="size-4" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {metrics.lowStockCount} Produk
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {metrics.lowStockCount > 0
              ? "Perlu di-transfer dari gudang ke etalase"
              : "Semua stok etalase dalam batas aman"}
          </CardDescription>
        </CardContent>
      </Card>

      {/* 4. Petty Cash In / Out */}
      <Card className="border-l-4 border-l-blue-500 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Kas Operasional
          </CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconCash className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex items-center text-emerald-600 dark:text-emerald-400">
              <IconArrowDownLeft className="size-3.5 mr-0.5 inline" />
              {formatIDR(metrics.cashIn)}
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span className="flex items-center text-red-600 dark:text-red-400">
              <IconArrowUpRight className="size-3.5 mr-0.5 inline" />
              {formatIDR(metrics.cashOut)}
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Kas Masuk vs Kas Keluar hari ini
          </CardDescription>
        </CardContent>
      </Card>

      {/* 5. Voids Today */}
      <Card
        className={`border-l-4 shadow-xs ${
          metrics.voidCount > 0
            ? "border-l-red-500 bg-red-500/5 dark:bg-red-500/10"
            : "border-l-muted"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Void Hari Ini
          </CardTitle>
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${
              metrics.voidCount > 0
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <IconReceiptOff className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {metrics.voidCount} Void
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {metrics.voidCount > 0
              ? `Total batal: ${formatIDR(metrics.voidValue)}`
              : "Tidak ada pembatalan transaksi"}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
