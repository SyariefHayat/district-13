import * as React from "react";
import {
  IconHistory,
  IconShieldLock,
  IconReceipt,
  IconDatabase,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type AuditLogSummary } from "../data/auditLogData";

interface AuditLogStatsCardsProps {
  summary: AuditLogSummary;
  isLoading?: boolean;
}

export function AuditLogStatsCards({
  summary,
  isLoading,
}: AuditLogStatsCardsProps) {
  const kpis = React.useMemo(() => {
    return [
      {
        label: "Total Aktivitas",
        value: `${summary.totalLogs.toLocaleString("id-ID")} Log`,
        description: "Total aktivitas tercatat",
        icon: IconHistory,
      },
      {
        label: "Aktivitas Keamanan",
        value: `${summary.securityEvents.toLocaleString("id-ID")} Event`,
        description: "Login & sesi autentikasi",
        icon: IconShieldLock,
      },
      {
        label: "Aktivitas Transaksi",
        value: `${summary.transactionEvents.toLocaleString("id-ID")} Event`,
        description: "Penjualan, void & kas",
        icon: IconReceipt,
      },
      {
        label: "Perubahan Data",
        value: `${summary.dataChangeEvents.toLocaleString("id-ID")} Event`,
        description: "Produk, stok & user",
        icon: IconDatabase,
      },
    ];
  }, [summary]);

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {kpi.label}
              </CardDescription>
              <div className="rounded-lg bg-primary/10 p-2 text-primary dark:bg-primary/20">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardFooter className="flex flex-col items-start gap-1 pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-4 w-20" />
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    {kpi.value}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {kpi.description}
                  </span>
                </>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
