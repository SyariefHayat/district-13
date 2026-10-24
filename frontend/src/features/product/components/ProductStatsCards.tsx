import {
  IconAlertCircle,
  IconCheck,
  IconCategory,
  IconPackage,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import { type ProductItem } from "../data/productData";

interface ProductStatsCardsProps {
  products: ProductItem[];
  isLoading?: boolean;
}

export function ProductStatsCards({
  products,
  isLoading,
}: ProductStatsCardsProps) {
  const totalProducts = products.length;
  const availableCount = products.filter(
    (p) => p.isActive && p.isAvailable && p.stock > 0
  ).length;
  const outOfStockCount = products.filter(
    (p) => p.stock === 0 || !p.isAvailable
  ).length;
  const categoriesCount = new Set(products.map((p) => p.category)).size;

  const stats = [
    {
      label: "Total Produk",
      value: totalProducts.toString(),
      helper: "Item terdaftar dalam katalog",
      icon: IconPackage,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Produk Siap Jual",
      value: availableCount.toString(),
      helper: "Tersedia & stok mencukupi",
      icon: IconCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Stok Habis / Nonaktif",
      value: outOfStockCount.toString(),
      helper: "Perlu restock atau aktivasi",
      icon: IconAlertCircle,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Total Kategori",
      value: categoriesCount.toString(),
      helper: "Kelompok menu aktif",
      icon: IconCategory,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="@container/card">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Icon className={cn("size-4", stat.color)} />
                {stat.label}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {isLoading ? <Skeleton className="h-8 w-36" /> : stat.value}
              </CardTitle>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {stat.helper}
                </span>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
