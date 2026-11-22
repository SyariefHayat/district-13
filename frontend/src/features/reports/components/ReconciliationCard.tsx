import * as React from "react";
import {
  IconScale,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconCalendarEvent,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";

export interface ReconciliationDay {
  date: string;
  calendarSales: number;
  calendarTxCount: number;
  shiftSales: number;
  shiftTxCount: number;
  shiftCount: number;
  difference: number;
}

export interface ReconciliationData {
  summary: {
    totalCalendarSales: number;
    totalShiftSales: number;
    netDifference: number;
  };
  days: ReconciliationDay[];
}

interface ReconciliationCardProps {
  startDate?: string;
  endDate?: string;
}

export function ReconciliationCard({
  startDate,
  endDate,
}: ReconciliationCardProps) {
  const { authorizedFetch } = useAuth();
  const [data, setData] = React.useState<ReconciliationData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReconciliation = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const start =
        startDate ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
      const end = endDate || today;

      const res = await authorizedFetch(
        `/reports/reconciliation?startDate=${start}&endDate=${end}`
      );
      if (!res.ok) {
        throw new Error(`Gagal memuat rekonsiliasi (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(
        err.message || "Terjadi kesalahan saat memuat data rekonsiliasi"
      );
    } finally {
      setIsLoading(false);
    }
  }, [authorizedFetch, startDate, endDate]);

  React.useEffect(() => {
    void fetchReconciliation();
  }, [fetchReconciliation]);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Card className="shadow-xs border border-border">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconScale className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Rekonsiliasi Penjualan: Kalender vs Shift
            </CardTitle>
            <CardDescription className="text-xs">
              Perbandingan penjualan cut-off kalender (00:00 - 23:59 WIB)
              terhadap shift yang dibuka pada hari tersebut
            </CardDescription>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchReconciliation()}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs shadow-xs"
        >
          <IconRefresh className="size-3.5" />
          <span>Segarkan</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <IconAlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ) : data ? (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Penjualan Kalender (00:00 WIB)
                </span>
                <p className="mt-1 text-base font-bold text-foreground">
                  {formatIDR(data.summary.totalCalendarSales)}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Penjualan Shift Dibuka
                </span>
                <p className="mt-1 text-base font-bold text-foreground">
                  {formatIDR(data.summary.totalShiftSales)}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Selisih Bersih (Net Difference)
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <p
                    className={`text-base font-bold ${
                      data.summary.netDifference === 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {formatIDR(data.summary.netDifference)}
                  </p>
                  {data.summary.netDifference === 0 ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]"
                    >
                      <IconCheck className="size-3 mr-0.5" /> Seimbang
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]"
                    >
                      Lintas Malam
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Reconciliation Table */}
            {data.days.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-6 text-center">
                <IconCalendarEvent className="size-8 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Belum ada data transaksi pada rentang tanggal ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5">Penjualan Kalender (WIB)</th>
                      <th className="p-2.5">Tx Kalender</th>
                      <th className="p-2.5">Penjualan Shift</th>
                      <th className="p-2.5">Tx Shift</th>
                      <th className="p-2.5">Selisih</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.days.map((row) => (
                      <tr key={row.date} className="hover:bg-muted/30">
                        <td className="p-2.5 font-medium text-foreground">
                          {row.date}
                        </td>
                        <td className="p-2.5">
                          {formatIDR(row.calendarSales)}
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          {row.calendarTxCount}
                        </td>
                        <td className="p-2.5">{formatIDR(row.shiftSales)}</td>
                        <td className="p-2.5 text-muted-foreground">
                          {row.shiftTxCount}
                        </td>
                        <td
                          className={`p-2.5 font-semibold ${
                            row.difference === 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {formatIDR(row.difference)}
                        </td>
                        <td className="p-2.5">
                          {row.difference === 0 ? (
                            <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Sesuai
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Lintas Shift Malam
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground italic">
              * Catatan: Selisih terjadi apabila terdapat shift malam (S3 Malam
              23:00 - 08:00 WIB) yang dibuka pada satu hari dan mencatat
              transaksi setelah pukul 00:00 WIB pada hari kalender berikutnya.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
