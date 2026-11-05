import * as React from "react";
import {
  IconUsers,
  IconReceipt,
  IconScale,
  IconShieldCheck,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "../data/salesReportData";
import { type CashierAuditSummary } from "../data/cashierAuditData";

interface CashierAuditStatsCardsProps {
  summary: CashierAuditSummary;
  isLoading?: boolean;
}

export function CashierAuditStatsCards({
  summary,
  isLoading,
}: CashierAuditStatsCardsProps) {
  const kpis = React.useMemo(() => {
    return [
      {
        label: "Total Kasir Aktif",
        value: `${summary.totalCashiers} Kasir`,
        description: "Kasir bertugas teraudit",
        icon: IconUsers,
      },
      {
        label: "Total Transaksi",
        value: `${summary.totalTransactions.toLocaleString("id-ID")} Transaksi`,
        description: "Akumulasi nota diproses",
        icon: IconReceipt,
      },
      {
        label: "Total Selisih Kas",
        value:
          summary.totalDifference > 0
            ? `+${formatIDR(summary.totalDifference)}`
            : formatIDR(summary.totalDifference),
        description: "Net selisih kas fisik",
        icon: IconScale,
        diffColor:
          summary.totalDifference < 0
            ? "text-rose-600 dark:text-rose-400"
            : summary.totalDifference > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : undefined,
      },
      {
        label: "Rata-rata Akurasi",
        value: `${summary.averageAccuracy}%`,
        description: "Tingkat akurasi rekonsiliasi",
        icon: IconShieldCheck,
      },
    ];
  }, [summary]);

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {kpi.label}
              </CardDescription>
              <div className="rounded-lg bg-primary/10 p-2 text-primary dark:bg-primary/20">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardFooter className="flex flex-col items-start gap-1 pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-20" />
                </>
              ) : (
                <>
                  <CardTitle
                    className={`text-2xl font-bold tracking-tight ${kpi.diffColor || ""}`}
                  >
                    {kpi.value}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {kpi.description}
                  </span>
                </>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
