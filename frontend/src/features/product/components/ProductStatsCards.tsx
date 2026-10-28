import * as React from "react";
import {
  IconCoin,
  IconShoppingCart,
  IconFlame,
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
import { formatProductPrice, type ProductItem } from "../data/productData";

interface ProductStatsCardsProps {
  products: ProductItem[];
  isLoading?: boolean;
}

export function ProductStatsCards({
  products,
  isLoading,
}: ProductStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const totalProducts = products.length;

    // 1. Gross Product Sales (Σ price * soldCount)
    const totalRevenue = products.reduce(
      (sum, p) => sum + p.price * (p.soldCount || 0),
      0
    );

    // 2. Units Sold (Σ soldCount)
    const totalUnitsSold = products.reduce(
      (sum, p) => sum + (p.soldCount || 0),
      0
    );

    // 3. Top Performer (Highest soldCount)
    const sortedBySales = [...products].sort(
      (a, b) => (b.soldCount || 0) - (a.soldCount || 0)
    );
    const topProduct = sortedBySales[0];
    const topProductShare =
      totalUnitsSold > 0 && topProduct?.soldCount
        ? ((topProduct.soldCount / totalUnitsSold) * 100).toFixed(1)
        : "0";

    // 4. Rasio Produk Laku (SKU with soldCount > 0 vs Total SKU)
    const activeSoldProducts = products.filter(
      (p) => (p.soldCount || 0) > 0
    ).length;
    const sellThroughRatio =
      totalProducts > 0
        ? ((activeSoldProducts / totalProducts) * 100).toFixed(1)
        : "0";

    return {
      totalRevenue,
      totalUnitsSold,
      topProduct,
      topProductShare,
      activeSoldProducts,
      totalProducts,
      sellThroughRatio,
    };
  }, [products]);

  const kpis = [
    {
      label: "Gross Product Sales",
      value: formatProductPrice(metrics.totalRevenue),
      description: "Total omzet katalog",
      icon: IconCoin,
    },
    {
      label: "Sold",
      value: `${metrics.totalUnitsSold.toLocaleString("id-ID")} pcs`,
      description: "Total item terjual",
      icon: IconShoppingCart,
    },
    {
      label: "Top Performer",
      value: metrics.topProduct?.name || "Belum ada data",
      description: `${metrics.topProduct?.soldCount || 0} pcs (${metrics.topProductShare}%)`,
      icon: IconFlame,
    },
    {
      label: "Rasio Produk Laku",
      value: `${metrics.sellThroughRatio}%`,
      description: `${metrics.activeSoldProducts} dari ${metrics.totalProducts} SKU`,
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
