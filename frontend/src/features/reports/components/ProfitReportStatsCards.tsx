import * as React from "react";
import {
  IconTrendingUp,
  IconPercentage,
  IconReceiptTax,
  IconWallet,
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
import { type ProfitReportSummary } from "../data/profitReportData";

interface ProfitReportStatsCardsProps {
  summary: ProfitReportSummary;
  isLoading?: boolean;
}

export function ProfitReportStatsCards({
  summary,
  isLoading,
}: ProfitReportStatsCardsProps) {
  const kpis = React.useMemo(() => {
    return [
      {
        label: "Total Laba Kotor",
        value: formatIDR(summary.grossProfit),
        description: "Total keuntungan bersih",
        icon: IconTrendingUp,
      },
      {
        label: "Margin Keuntungan",
        value: `${summary.profitMargin}%`,
        description: "Rasio laba terhadap omzet",
        icon: IconPercentage,
      },
      {
        label: "Total Modal (HPP)",
        value: formatIDR(summary.totalCogs),
        description: "Beban pokok penjualan",
        icon: IconReceiptTax,
      },
      {
        label: "Omzet Penjualan",
        value: formatIDR(summary.netRevenue),
        description: "Total pendapatan bersih",
        icon: IconWallet,
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
