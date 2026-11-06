import {
  IconCalendarEvent,
  IconReceipt,
  IconShoppingCart,
  IconWallet,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "../data/cashierData";
import type { CashierSchedule } from "../data/cashierData";

interface CashierMetrics {
  openingCash: number;
  cashSales: number;
  nonCashSales: number;
  totalSales: number;
  cashIn: number;
  cashOut: number;
  drawerCash: number;
  transactionCount: number;
  avgTransaction: number;
}

interface CashierStatsCardsProps {
  metrics: CashierMetrics;
  todaySchedule: CashierSchedule | null;
  isLoading: boolean;
}

export function CashierStatsCards({
  metrics,
  todaySchedule,
  isLoading,
}: CashierStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-36 mb-2" />
            <Skeleton className="h-3 w-48" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {/* 1. Kas di Laci */}
      <Card className="relative overflow-hidden border-border/60">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Kas di Laci (Drawer)
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconWallet className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatIDR(metrics.drawerCash)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
              <span>Modal: {formatIDR(metrics.openingCash)}</span>
              {(metrics.cashIn > 0 || metrics.cashOut > 0) && (
                <span className="text-foreground font-medium">
                  • Mutasi: +{formatIDR(metrics.cashIn)} / -
                  {formatIDR(metrics.cashOut)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Penjualan */}
      <Card className="relative overflow-hidden border-border/60">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Penjualan Shift Ini
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <IconReceipt className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatIDR(metrics.totalSales)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
              <span>Tunai: {formatIDR(metrics.cashSales)}</span>
              <span>•</span>
              <span>Non-Tunai: {formatIDR(metrics.nonCashSales)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Transaksi */}
      <Card className="relative overflow-hidden border-border/60">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Transaksi Selesai
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <IconShoppingCart className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.transactionCount}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                transaksi
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Rata-rata: {formatIDR(metrics.avgTransaction)} / transaksi
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Jadwal Shift Hari Ini */}
      <Card className="relative overflow-hidden border-border/60">
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Jadwal Shift Hari Ini
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <IconCalendarEvent className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-foreground truncate">
                {todaySchedule?.shiftName || "Shift Operasional"}
              </span>
              {todaySchedule && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
                >
                  {todaySchedule.status}
                </Badge>
              )}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {todaySchedule
                ? `${todaySchedule.startTime} - ${todaySchedule.endTime} WIB`
                : "Tidak ada jadwal khusus"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
