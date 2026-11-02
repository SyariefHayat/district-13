import * as React from "react";
import {
  IconCheck,
  IconQrcode,
  IconReceipt,
  IconReceiptOff,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR, type SaleTransaction } from "../data/salesData";

interface SalesStatsCardsProps {
  transactions: SaleTransaction[];
  isLoading?: boolean;
}

export function SalesStatsCards({
  transactions,
  isLoading,
}: SalesStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(
      (t) => t.status === "COMPLETED"
    );
    const voidedCount = transactions.filter(
      (t) => t.status === "VOIDED"
    ).length;

    const totalRevenue = completedTransactions.reduce(
      (sum, t) => sum + (t.totalAmount || 0),
      0
    );

    const qrisTransactions = completedTransactions.filter(
      (t) => t.paymentMethod === "QRIS"
    );
    const qrisRevenue = qrisTransactions.reduce(
      (sum, t) => sum + (t.totalAmount || 0),
      0
    );

    const cashTransactions = completedTransactions.filter(
      (t) => t.paymentMethod === "CASH"
    );
    const cashRevenue = cashTransactions.reduce(
      (sum, t) => sum + (t.totalAmount || 0),
      0
    );

    const completedShare =
      totalTransactions > 0
        ? ((completedTransactions.length / totalTransactions) * 100).toFixed(1)
        : "0";

    const qrisShare =
      totalRevenue > 0 ? ((qrisRevenue / totalRevenue) * 100).toFixed(1) : "0";

    return {
      totalTransactions,
      completedCount: completedTransactions.length,
      voidedCount,
      totalRevenue,
      qrisRevenue,
      cashRevenue,
      completedShare,
      qrisShare,
    };
  }, [transactions]);

  const kpis = [
    {
      label: "Total Pendapatan",
      value: formatIDR(metrics.totalRevenue),
      description: `${metrics.completedCount} transaksi selesai`,
      icon: IconReceipt,
    },
    {
      label: "Transaksi Berhasil",
      value: `${metrics.completedCount} pesanan`,
      description: `${metrics.completedShare}% dari total transaksi`,
      icon: IconCheck,
    },
    {
      label: "Pembayaran QRIS",
      value: formatIDR(metrics.qrisRevenue),
      description: `${metrics.qrisShare}% omset (Tunai: ${formatIDR(metrics.cashRevenue)})`,
      icon: IconQrcode,
    },
    {
      label: "Transaksi Dibatalkan",
      value: `${metrics.voidedCount} void`,
      description: "Pesanan dibatalkan / retur",
      icon: IconReceiptOff,
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
