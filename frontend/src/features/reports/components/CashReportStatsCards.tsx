import * as React from "react";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconWallet,
  IconArrowsExchange,
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
import { type CashReportSummary } from "../data/cashReportData";

interface CashReportStatsCardsProps {
  summary: CashReportSummary;
  isLoading?: boolean;
}

export function CashReportStatsCards({
  summary,
  isLoading,
}: CashReportStatsCardsProps) {
  const kpis = React.useMemo(() => {
    return [
      {
        label: "Total Kas Masuk",
        value: formatIDR(summary.totalCashIn),
        description: "Uang kas diterima",
        icon: IconArrowDownRight,
      },
      {
        label: "Total Kas Keluar",
        value: formatIDR(summary.totalCashOut),
        description: "Pengeluaran operasional",
        icon: IconArrowUpRight,
      },
      {
        label: "Arus Kas Bersih",
        value: formatIDR(summary.netCashFlow),
        description: "Surplus kas berjalan",
        icon: IconWallet,
      },
      {
        label: "Total Mutasi Kas",
        value: `${summary.totalCount} Mutasi`,
        description: `${summary.inCount} masuk, ${summary.outCount} keluar`,
        icon: IconArrowsExchange,
      },
    ];
  }, [summary]);

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="@container/card">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Icon className="size-4" />
                {kpi.label}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {isLoading ? <Skeleton className="h-8 w-36" /> : kpi.value}
              </CardTitle>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {kpi.description}
                </span>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
