import * as React from "react";
import {
  IconCoins,
  IconReceipt,
  IconFlame,
  IconCircleCheck,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatPaymentAmount,
  type PaymentMethodItem,
} from "../data/paymentData";

interface PaymentStatsCardsProps {
  payments: PaymentMethodItem[];
  isLoading?: boolean;
}

export function PaymentStatsCards({
  payments,
  isLoading,
}: PaymentStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const totalMethods = payments.length;

    // 1. Total Volume
    const totalVolume = payments.reduce(
      (sum, p) => sum + (p.totalVolume || 0),
      0
    );

    // 2. Total Transactions
    const totalTransactions = payments.reduce(
      (sum, p) => sum + (p.transactionCount || 0),
      0
    );

    // 3. Top Performer
    const sortedByVolume = [...payments].sort(
      (a, b) => (b.totalVolume || 0) - (a.totalVolume || 0)
    );
    const topMethod = sortedByVolume[0];
    const topMethodShare =
      totalVolume > 0 && topMethod?.totalVolume
        ? ((topMethod.totalVolume / totalVolume) * 100).toFixed(1)
        : "0";

    // 4. Active Methods Ratio
    const activeMethodsCount = payments.filter((p) => p.isActive).length;
    const activeRatio =
      totalMethods > 0
        ? ((activeMethodsCount / totalMethods) * 100).toFixed(1)
        : "0";

    return {
      totalVolume,
      totalTransactions,
      topMethod,
      topMethodShare,
      activeMethodsCount,
      totalMethods,
      activeRatio,
    };
  }, [payments]);

  const kpis = [
    {
      label: "Total Volume Transaksi",
      value: formatPaymentAmount(metrics.totalVolume),
      description: "Total omzet",
      icon: IconCoins,
    },
    {
      label: "Total Transaksi",
      value: `${metrics.totalTransactions.toLocaleString("id-ID")} trx`,
      description: "Transaksi berhasil",
      icon: IconReceipt,
    },
    {
      label: "Metode Terpopuler",
      value: metrics.topMethod?.name || "-",
      description: `${metrics.topMethodShare}% total omzet`,
      icon: IconFlame,
    },
    {
      label: "Metode Aktif",
      value: `${metrics.activeRatio}%`,
      description: `${metrics.activeMethodsCount} dari ${metrics.totalMethods} aktif`,
      icon: IconCircleCheck,
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
                title={typeof kpi.value === "string" ? kpi.value : undefined}
                className="text-xl font-semibold tabular-nums truncate @[250px]/card:text-2xl"
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
