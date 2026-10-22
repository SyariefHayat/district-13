import {
  IconAlertCircle,
  IconCheck,
  IconCategory,
  IconPackage,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { type ProductItem } from "../data/productData";

interface ProductStatsCardsProps {
  products: ProductItem[];
}

export function ProductStatsCards({ products }: ProductStatsCardsProps) {
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
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                {stat.label}
              </span>
              <div className={`rounded-lg p-2 ${stat.bgColor} ${stat.color}`}>
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stat.helper}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
