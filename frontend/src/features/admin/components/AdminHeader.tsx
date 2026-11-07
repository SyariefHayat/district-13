import * as React from "react";
import { Link } from "react-router";
import {
  IconArrowsExchange,
  IconCalendarEvent,
  IconCash,
  IconClock,
  IconPackage,
  IconRefresh,
  IconShieldLock,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

interface AdminHeaderProps {
  adminName: string;
  activeShiftsCount: number;
  lowStockCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCashMovement: () => void;
  onOpenTransfer: () => void;
}

export function AdminHeader({
  adminName,
  activeShiftsCount,
  lowStockCount,
  isRefreshing,
  onRefresh,
  onOpenCashMovement,
  onOpenTransfer,
}: AdminHeaderProps) {
  const [currentTime, setCurrentTime] = React.useState<string>(() =>
    new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between lg:p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconShieldLock className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Dashboard Operasional Admin
              </h1>
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary font-medium"
              >
                Store Operations
              </Badge>
              {activeShiftsCount > 0 ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                >
                  <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  {activeShiftsCount} Shift Kasir Aktif
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                >
                  Tidak Ada Shift Kasir Aktif
                </Badge>
              )}
              {lowStockCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-medium"
                >
                  {lowStockCount} Perlu Transfer Etalase
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Selamat bertugas,{" "}
              <span className="font-semibold text-foreground">{adminName}</span>
              . Pantau kasir, stok etalase, transaksi, dan arus kas harian
              secara real-time.
            </p>
          </div>
        </div>

        {/* Live Clock & Refresh */}
        <div className="flex flex-wrap items-center gap-2 sm:self-center">
          <div className="flex items-center gap-2 rounded-lg border bg-background/80 px-3 py-1.5 text-xs font-mono shadow-xs">
            <IconClock className="size-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{currentTime}</span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-muted-foreground">{todayFormatted}</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs shadow-xs"
            title="Muat ulang data"
          >
            <IconRefresh
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onOpenTransfer}
            className="gap-1.5 text-xs font-medium"
          >
            <IconArrowsExchange className="size-4" />
            Transfer ke Etalase
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCashMovement}
            className="gap-1.5 text-xs font-medium"
          >
            <IconCash className="size-4" />
            Kas Operasional (+ / -)
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            to="/dashboard/schedules"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className:
                "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground",
            })}
          >
            <IconCalendarEvent className="size-3.5" />
            Jadwal Shift
          </Link>
          <Link
            to="/dashboard/products"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className:
                "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground",
            })}
          >
            <IconPackage className="size-3.5" />
            Katalog Produk
          </Link>
        </div>
      </div>
    </div>
  );
}
