import * as React from "react";
import {
  IconBuildingWarehouse,
  IconBuildingStore,
  IconAlertTriangle,
  IconArrowsTransferUpDown,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WarehouseInventoryItem } from "../data/warehouseData";

interface WarehouseStatsCardsProps {
  items: WarehouseInventoryItem[];
  isLoading?: boolean;
}

export function WarehouseStatsCards({
  items,
  isLoading,
}: WarehouseStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const totalWarehouseUnits = items.reduce(
      (sum, item) => sum + (item.warehouseStock || 0),
      0
    );
    const totalDisplayUnits = items.reduce(
      (sum, item) => sum + (item.displayStock || 0),
      0
    );
    const needsTransferItems = items.filter(
      (item) => item.displayStock <= 3 && item.warehouseStock > 0
    );
    const lowWarehouseItems = items.filter(
      (item) => item.warehouseStock <= item.minStockThreshold
    );

    return {
      totalWarehouseUnits,
      totalDisplayUnits,
      needsTransferCount: needsTransferItems.length,
      lowWarehouseCount: lowWarehouseItems.length,
      totalSKU: items.length,
    };
  }, [items]);

  const kpis = [
    {
      label: "Total Stok Gudang",
      value: `${metrics.totalWarehouseUnits.toLocaleString("id-ID")} unit`,
      description: `Total ${metrics.totalSKU} SKU`,
      icon: IconBuildingWarehouse,
    },
    {
      label: "Stok Etalase Toko",
      value: `${metrics.totalDisplayUnits.toLocaleString("id-ID")} unit`,
      description: "Siap jual di kasir",
      icon: IconBuildingStore,
    },
    {
      label: "Perlu Isi Etalase",
      value: `${metrics.needsTransferCount} item`,
      description: "Siap transfer ke etalase",
      icon: IconArrowsTransferUpDown,
    },
    {
      label: "Perlu Restock Gudang",
      value: `${metrics.lowWarehouseCount} item`,
      description: "Di bawah batas minimum",
      icon: IconAlertTriangle,
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
