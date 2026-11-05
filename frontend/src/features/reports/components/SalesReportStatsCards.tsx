import * as React from "react";
import {
  IconCoin,
  IconReceiptTax,
  IconWallet,
  IconChartPie,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR, type SalesReportSummary } from "../data/salesReportData";

interface SalesReportStatsCardsProps {
  summary: SalesReportSummary;
  isLoading?: boolean;
}

export function SalesReportStatsCards({
  summary,
  isLoading,
}: SalesReportStatsCardsProps) {
  const kpis = React.useMemo(() => {
    return [
      {
        label: "Penjualan Kotor (Gross)",
        value: formatIDR(summary.grossSales),
        description: "Total omzet kotor",
        icon: IconCoin,
      },
      {
        label: "Total Diskon",
        value: formatIDR(summary.discountTotal),
        description: `${summary.transactionCount.toLocaleString("id-ID")} transaksi`,
        icon: IconReceiptTax,
      },
      {
        label: "Penjualan Bersih (Net)",
        value: formatIDR(summary.netSales),
        description: "Total omzet bersih",
        icon: IconWallet,
      },
      {
        label: "Rata-rata Transaksi (AOV)",
        value: formatIDR(summary.averageTransactionValue),
        description: "Rata-rata per transaksi",
        icon: IconChartPie,
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
