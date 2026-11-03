import * as React from "react";
import {
  IconChartPie,
  IconCoin,
  IconFlame,
  IconReceipt,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR, type DiscountItem } from "../data/discountData";

interface DiscountStatsCardsProps {
  discounts: DiscountItem[];
  isLoading?: boolean;
}

export function DiscountStatsCards({
  discounts,
  isLoading,
}: DiscountStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const totalCount = discounts.length;
    const activeCount = discounts.filter((d) => d.isActive).length;

    // 1. Gross Discount Given Estimated (Σ nominal or % * 50k base * usageCount)
    const totalSavings = discounts.reduce((sum, d) => {
      const perUse =
        d.type === "fixed"
          ? d.value
          : Math.min(d.maxDiscount || 25000, 50000 * (d.value / 100));
      return sum + perUse * (d.usageCount || 0);
    }, 0);

    // 2. Total Transactions Applied (Σ usageCount)
    const totalApplied = discounts.reduce(
      (sum, d) => sum + (d.usageCount || 0),
      0
    );

    // 3. Top Performer (Highest usageCount)
    const sortedByUsage = [...discounts].sort(
      (a, b) => (b.usageCount || 0) - (a.usageCount || 0)
    );
    const topPromo = sortedByUsage[0];
    const topPromoShare =
      totalApplied > 0 && topPromo?.usageCount
        ? ((topPromo.usageCount / totalApplied) * 100).toFixed(1)
        : "0";

    // 4. Rasio Diskon Aktif
    const activeRatio =
      totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : "0";

    return {
      totalSavings,
      totalApplied,
      topPromo,
      topPromoShare,
      activeCount,
      totalCount,
      activeRatio,
    };
  }, [discounts]);

  const kpis = [
    {
      label: "Total Potongan Diberikan",
      value: formatIDR(metrics.totalSavings),
      description: "Total potongan transaksi kasir",
      icon: IconCoin,
    },
    {
      label: "Transaksi Terdiskon",
      value: `${metrics.totalApplied.toLocaleString("id-ID")} transaksi`,
      description: "Total penggunaan diskon",
      icon: IconReceipt,
    },
    {
      label: "Diskon Terpopuler",
      value: metrics.topPromo?.name || "Belum ada data",
      description: `${metrics.topPromo?.usageCount || 0} transaksi (${metrics.topPromoShare}%)`,
      icon: IconFlame,
    },
    {
      label: "Rasio Diskon Aktif",
      value: `${metrics.activeRatio}%`,
      description: `${metrics.activeCount} dari ${metrics.totalCount} diskon aktif`,
      icon: IconChartPie,
    },
  ];

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
              <CardTitle
                className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl truncate"
                title={typeof kpi.value === "string" ? kpi.value : undefined}
              >
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
