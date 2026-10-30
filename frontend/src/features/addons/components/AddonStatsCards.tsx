import * as React from "react";
import {
  IconCheck,
  IconCoins,
  IconEyeOff,
  IconLayersIntersect,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR, type AddonItem } from "../data/addonData";

interface AddonStatsCardsProps {
  addons: AddonItem[];
  isLoading?: boolean;
}

export function AddonStatsCards({ addons, isLoading }: AddonStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const totalAddons = addons.length;
    const activeCount = addons.filter((a) => a.isActive).length;
    const inactiveCount = addons.filter((a) => !a.isActive).length;
    const avgPrice =
      totalAddons > 0
        ? Math.round(
            addons.reduce((sum, item) => sum + item.price, 0) / totalAddons
          )
        : 0;
    const activeShare =
      totalAddons > 0 ? ((activeCount / totalAddons) * 100).toFixed(0) : "0";

    return {
      totalAddons,
      activeCount,
      inactiveCount,
      avgPrice,
      activeShare,
    };
  }, [addons]);

  const kpis = [
    {
      label: "Total Varian",
      value: `${metrics.totalAddons} varian`,
      description: "Pilihan kustomisasi terdaftar",
      icon: IconLayersIntersect,
    },
    {
      label: "Varian Aktif",
      value: `${metrics.activeCount} varian`,
      description: `${metrics.activeShare}% dari total katalog varian`,
      icon: IconCheck,
    },
    {
      label: "Varian Nonaktif",
      value: `${metrics.inactiveCount} varian`,
      description: "Disembunyikan dari POS & menu",
      icon: IconEyeOff,
    },
    {
      label: "Rata-rata Harga",
      value: formatIDR(metrics.avgPrice),
      description: "Biaya tambahan per opsi menu",
      icon: IconCoins,
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
