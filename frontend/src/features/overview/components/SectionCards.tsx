import {
  IconCash,
  IconCoin,
  IconReceipt,
  IconShoppingCart,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type KpiItem } from "../data/overviewData";

const defaultKpis: KpiItem[] = [
  {
    label: "Sales",
    value: "Rp 12.450.000",
    trend: "+8.4%",
    trendDescription: "vs yesterday",
    trendPositive: true,
  },
  {
    label: "Net Profit",
    value: "Rp 3.240.000",
    trend: "+6.2%",
    trendDescription: "vs yesterday",
    trendPositive: true,
  },
  {
    label: "Transactions",
    value: "186",
    trend: "+12.0%",
    trendDescription: "vs yesterday",
    trendPositive: true,
  },
  {
    label: "Avg Transaction",
    value: "Rp 67.000",
    trend: "+3.1%",
    trendDescription: "vs yesterday",
    trendPositive: true,
  },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sales: IconShoppingCart,
  "Net Profit": IconCoin,
  Transactions: IconReceipt,
  "Avg Transaction": IconCash,
};

interface SectionCardsProps {
  kpis?: KpiItem[];
  isLoading?: boolean;
}

export function SectionCards({
  kpis = defaultKpis,
  isLoading,
}: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.label] ?? IconShoppingCart;
        return (
          <Card className="@container/card" key={kpi.label}>
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
                <>
                  <Badge
                    variant="outline"
                    className={
                      kpi.trendPositive
                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "border-rose-500/30 text-rose-600 dark:text-rose-400"
                    }
                  >
                    {kpi.trendPositive ? (
                      <IconTrendingUp className="size-4" />
                    ) : (
                      <IconTrendingDown className="size-4" />
                    )}
                    {kpi.trend}
                  </Badge>
                  {kpi.trendDescription && (
                    <span className="ml-2">{kpi.trendDescription}</span>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
