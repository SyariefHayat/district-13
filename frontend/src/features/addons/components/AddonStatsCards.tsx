import {
  IconCheck,
  IconCoins,
  IconEyeOff,
  IconLayersIntersect,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { formatIDR, type AddonItem } from "../data/addonData";

interface AddonStatsCardsProps {
  addons: AddonItem[];
}

export function AddonStatsCards({ addons }: AddonStatsCardsProps) {
  const totalAddons = addons.length;
  const activeCount = addons.filter((a) => a.isActive).length;
  const inactiveCount = addons.filter((a) => !a.isActive).length;
  const avgPrice =
    totalAddons > 0
      ? Math.round(
          addons.reduce((sum, item) => sum + item.price, 0) / totalAddons
        )
      : 0;

  const stats = [
    {
      label: "Total Varian & Tambahan",
      value: totalAddons.toString(),
      helper: "Pilihan kustomisasi terdaftar",
      icon: IconLayersIntersect,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Varian Aktif",
      value: activeCount.toString(),
      helper: "Tampil di kasir & menu pemesanan",
      icon: IconCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Varian Nonaktif",
      value: inactiveCount.toString(),
      helper: "Disembunyikan dari POS",
      icon: IconEyeOff,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Rata-rata Harga Tambahan",
      value: formatIDR(avgPrice),
      helper: "Biaya tambahan per opsi",
      icon: IconCoins,
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
