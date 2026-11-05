import * as React from "react";
import {
  IconClock,
  IconUserCheck,
  IconCash,
  IconScale,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "../data/salesReportData";
import { type ShiftReportSummary } from "../data/shiftReportData";

interface ShiftReportStatsCardsProps {
  summary: ShiftReportSummary;
  isLoading?: boolean;
}

export function ShiftReportStatsCards({
  summary,
  isLoading,
}: ShiftReportStatsCardsProps) {
  const kpis = React.useMemo(() => {
    return [
      {
        label: "Total Shift",
        value: `${summary.totalShifts} Shift`,
        description: `${summary.closedShifts} selesai`,
        icon: IconClock,
      },
      {
        label: "Shift Berjalan",
        value: `${summary.openShifts} Aktif`,
        description: "Kasir bertugas",
        icon: IconUserCheck,
      },
      {
        label: "Total Kas Akhir",
        value: formatIDR(summary.totalClosingCash),
        description: "Total kas fisik",
        icon: IconCash,
      },
      {
        label: "Selisih Kas",
        value: formatIDR(summary.totalCashDifference),
        description:
          summary.totalCashDifference === 0
            ? "Kas seimbang"
            : "Selisih tercatat",
        icon: IconScale,
      },
    ];
  }, [summary]);

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
