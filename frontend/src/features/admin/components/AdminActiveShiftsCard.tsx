import { Link } from "react-router";
import {
  IconAlertCircle,
  IconCash,
  IconClock,
  IconDoorExit,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatIDR,
  formatTimeOnly,
  type AdminActiveShift,
} from "../data/adminData";

interface AdminActiveShiftsCardProps {
  shifts: AdminActiveShift[];
  isLoading: boolean;
  onOpenCashMovement: (shift: AdminActiveShift) => void;
  onCloseShift: (shift: AdminActiveShift) => void;
}

export function AdminActiveShiftsCard({
  shifts,
  isLoading,
  onOpenCashMovement,
  onCloseShift,
}: AdminActiveShiftsCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconUsers className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Supervisi Kasir & Shift Berjalan
            </CardTitle>
            <CardDescription className="text-xs">
              Monitor laci kasir kas fisik, penjualan tunai, dan penutupan shift
            </CardDescription>
          </div>
        </div>
        <Link
          to="/dashboard/shifts"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-8 text-xs",
          })}
        >
          Laporan Semua Shift
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconAlertCircle className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              Tidak Ada Shift Kasir Aktif
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Saat ini belum ada kasir yang membuka register shift. Kasir dapat
              membuka shift dari halaman kasir.
            </p>
            <Link
              to="/dashboard/schedules"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "mt-4 text-xs",
              })}
            >
              Lihat Jadwal Kerja Hari Ini
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex flex-col justify-between rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 shadow-2xs gap-4"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {shift.cashierName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {shift.cashierName}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium"
                        >
                          <span className="mr-1 size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          Aktif
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <IconClock className="size-3" />
                        <span>Mulai jam: {formatTimeOnly(shift.openedAt)}</span>
                        <span>•</span>
                        <span>{shift.transactionCount} transaksi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash Metrics breakdown */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-4 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Modal Awal
                    </span>
                    <span className="font-medium text-foreground">
                      {formatIDR(shift.openingCash)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Penjualan Kas
                    </span>
                    <span className="font-medium text-foreground">
                      {formatIDR(shift.cashSales)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Kas Masuk / Keluar
                    </span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <span className="text-emerald-600 text-[11px]">
                        +{formatIDR(shift.cashIn)}
                      </span>
                      <span>/</span>
                      <span className="text-red-600 text-[11px]">
                        -{formatIDR(shift.cashOut)}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-primary block">
                      Perkiraan Laci Kas
                    </span>
                    <span className="font-bold text-foreground">
                      {formatIDR(shift.expectedCash)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenCashMovement(shift)}
                    className="h-8 gap-1.5 text-xs font-medium"
                  >
                    <IconCash className="size-3.5 text-blue-500" />
                    Kas Operasional
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onCloseShift(shift)}
                    className="h-8 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                  >
                    <IconDoorExit className="size-3.5" />
                    Tutup Shift
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
