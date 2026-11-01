import * as React from "react";
import {
  IconCheck,
  IconDeviceLaptop,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserItem } from "../data/userData";

interface UserStatsCardsProps {
  users: UserItem[];
  isLoading?: boolean;
}

export function UserStatsCards({ users, isLoading }: UserStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const totalUsers = users.length;
    const activeCount = users.filter((u) => u.isActive).length;
    const cashierCount = users.filter((u) => u.role === "CASHIER").length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    const ownerCount = users.filter((u) => u.role === "OWNER").length;
    const adminOwnerCount = adminCount + ownerCount;

    const activeShare =
      totalUsers > 0 ? ((activeCount / totalUsers) * 100).toFixed(1) : "0";
    const cashierShare =
      totalUsers > 0 ? ((cashierCount / totalUsers) * 100).toFixed(1) : "0";

    return {
      totalUsers,
      activeCount,
      cashierCount,
      adminCount,
      ownerCount,
      adminOwnerCount,
      activeShare,
      cashierShare,
    };
  }, [users]);

  const kpis = [
    {
      label: "Total Karyawan",
      value: `${metrics.totalUsers} staf`,
      description: "Seluruh staf terdaftar",
      icon: IconUsers,
    },
    {
      label: "Karyawan Aktif",
      value: `${metrics.activeCount} staf`,
      description: `${metrics.activeShare}% dari total staf`,
      icon: IconCheck,
    },
    {
      label: "Staf Kasir",
      value: `${metrics.cashierCount} kasir`,
      description: `${metrics.cashierShare}% staf operasional POS`,
      icon: IconDeviceLaptop,
    },
    {
      label: "Akses Manajerial",
      value: `${metrics.adminOwnerCount} staf`,
      description: `${metrics.adminCount} ADMIN, ${metrics.ownerCount} OWNER`,
      icon: IconShieldLock,
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
