import { Link } from "react-router";
import {
  IconCalendarEvent,
  IconChartBar,
  IconClock,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminStaffSchedule, HourlyTrafficData } from "../data/adminData";

interface AdminScheduleAndTrafficCardProps {
  schedules: AdminStaffSchedule[];
  hourlyTraffic: HourlyTrafficData[];
  isLoading: boolean;
}

export function AdminScheduleAndTrafficCard({
  schedules,
  hourlyTraffic,
  isLoading,
}: AdminScheduleAndTrafficCardProps) {
  // Find peak hour
  const peakHour = hourlyTraffic.reduce<HourlyTrafficData | null>(
    (max, curr) => {
      if (!max || curr.transactionCount > max.transactionCount) return curr;
      return max;
    },
    null
  );

  const maxTxCount = Math.max(
    1,
    ...(hourlyTraffic.map((h) => h.transactionCount) || [1])
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 1. Today's Staff Shift Schedule */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <IconCalendarEvent className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Jadwal Kerja Karyawan Hari Ini
              </CardTitle>
              <CardDescription className="text-xs">
                Roster penugasan shift kasir & staf operasional
              </CardDescription>
            </div>
          </div>
          <Link
            to="/dashboard/schedules"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-8 text-xs",
            })}
          >
            Atur Jadwal
          </Link>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <IconCalendarEvent className="size-5" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                Belum Ada Jadwal Hari Ini
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Tidak ada staf yang dijadwalkan hari ini. Klik "Atur Jadwal"
                untuk membuat penugasan shift.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {schedules.slice(0, 5).map((sched) => (
                <div
                  key={sched.id}
                  className="flex items-center justify-between p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {sched.userName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {sched.shiftName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <IconClock className="size-3" />
                      <span>
                        {sched.startTime} - {sched.endTime}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      sched.status === "COMPLETED"
                        ? "outline"
                        : sched.status === "CONFIRMED"
                          ? "default"
                          : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {sched.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Hourly Store Traffic (Busy Hours) */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IconChartBar className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Tingkat Kepadatan Toko (Jam Ramai)
              </CardTitle>
              <CardDescription className="text-xs">
                Distribusi transaksi per jam untuk optimasi staf register
              </CardDescription>
            </div>
          </div>
          {peakHour && peakHour.transactionCount > 0 && (
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary text-[10px]"
            >
              Peak: Jam {String(peakHour.hour).padStart(2, "0")}:00 (
              {peakHour.transactionCount} trx)
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : hourlyTraffic.length === 0 ||
            hourlyTraffic.every((h) => h.transactionCount === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <IconChartBar className="size-5" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                Belum Ada Aktivitas Jam Ramai
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Grafik aktivitas transaksi per jam akan terbentuk seiring
                berjalannya transaksi hari ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Hourly mini bars for working hours 08:00 to 22:00 */}
              <div className="grid grid-cols-7 gap-1.5 pt-2 sm:grid-cols-14">
                {hourlyTraffic
                  .filter((h) => h.hour >= 8 && h.hour <= 22)
                  .map((h) => {
                    const heightPercent = Math.min(
                      100,
                      Math.max(12, (h.transactionCount / maxTxCount) * 100)
                    );
                    const isPeak =
                      peakHour &&
                      peakHour.hour === h.hour &&
                      h.transactionCount > 0;

                    return (
                      <div
                        key={h.hour}
                        className="flex flex-col items-center gap-1 group"
                        title={`Jam ${String(h.hour).padStart(2, "0")}:00 - ${h.transactionCount} transaksi`}
                      >
                        <div className="relative flex h-24 w-full items-end justify-center rounded bg-muted/30 p-0.5">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-sm transition-all ${
                              isPeak
                                ? "bg-primary"
                                : h.transactionCount > 0
                                  ? "bg-primary/50 group-hover:bg-primary/80"
                                  : "bg-transparent"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {String(h.hour).padStart(2, "0")}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
                <span>Jam Operasional (08:00 - 22:00 WIB)</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-xs bg-primary inline-block" />
                  Jam Teramai
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
