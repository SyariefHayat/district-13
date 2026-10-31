import * as React from "react";
import {
  IconArrowDownLeft,
  IconArrowsTransferUpDown,
  IconBuildingStore,
  IconShoppingCart,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WarehouseMovementItem } from "../data/warehouseData";

interface WarehouseMovementsStatsCardsProps {
  movements: WarehouseMovementItem[];
  isLoading?: boolean;
}

export function WarehouseMovementsStatsCards({
  movements,
  isLoading,
}: WarehouseMovementsStatsCardsProps) {
  const metrics = React.useMemo(() => {
    let totalStockInQty = 0;
    let stockInCount = 0;
    let totalTransferQty = 0;
    let transferCount = 0;
    let totalSalesQty = 0;
    let salesCount = 0;

    for (const m of movements) {
      if (m.type === "STOCK_IN") {
        totalStockInQty += m.quantity;
        stockInCount++;
      } else if (m.type === "TRANSFER") {
        totalTransferQty += m.quantity;
        transferCount++;
      } else if (m.type === "SALE") {
        totalSalesQty += m.quantity;
        salesCount++;
      }
    }

    return {
      totalMovements: movements.length,
      totalStockInQty,
      stockInCount,
      totalTransferQty,
      transferCount,
      totalSalesQty,
      salesCount,
    };
  }, [movements]);

  const kpis = [
    {
      label: "Total Mutasi",
      value: `${metrics.totalMovements.toLocaleString("id-ID")} Log`,
      description: "Log aktivitas pergerakan stok",
      icon: IconArrowsTransferUpDown,
    },
    {
      label: "Restock",
      value: `+${metrics.totalStockInQty.toLocaleString("id-ID")} pcs`,
      description: `${metrics.stockInCount} kali pasokan masuk`,
      icon: IconArrowDownLeft,
    },
    {
      label: "Transfer",
      value: `${metrics.totalTransferQty.toLocaleString("id-ID")} pcs`,
      description: `${metrics.transferCount} kali mutasi ke etalase`,
      icon: IconBuildingStore,
    },
    {
      label: "Penjualan",
      value: `${metrics.totalSalesQty.toLocaleString("id-ID")} pcs`,
      description: `${metrics.salesCount} item transaksi kasir`,
      icon: IconShoppingCart,
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
