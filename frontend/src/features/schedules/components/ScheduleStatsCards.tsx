import * as React from "react";
import {
  IconCalendarEvent,
  IconClock,
  IconSun,
  IconUserCheck,
} from "@tabler/icons-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTodayDateString, type ScheduleItem } from "../data/scheduleData";

interface ScheduleStatsCardsProps {
  schedules: ScheduleItem[];
  isLoading?: boolean;
}

export function ScheduleStatsCards({
  schedules,
  isLoading,
}: ScheduleStatsCardsProps) {
  const metrics = React.useMemo(() => {
    const todayStr = getTodayDateString();
    const todaySchedules = schedules.filter((s) => s.date === todayStr);

    const totalCount = schedules.length;
    const todayCount = todaySchedules.length;
    const onDutyCount = schedules.filter((s) => s.status === "ON_DUTY").length;
    const morningCount = schedules.filter(
      (s) => s.shiftType === "MORNING"
    ).length;
    const afternoonCount = schedules.filter(
      (s) => s.shiftType === "AFTERNOON"
    ).length;
    const nightCount = schedules.filter((s) => s.shiftType === "NIGHT").length;

    const todayShare =
      totalCount > 0 ? ((todayCount / totalCount) * 100).toFixed(1) : "0";

    return {
      totalCount,
      todayCount,
      onDutyCount,
      morningCount,
      afternoonCount,
      nightCount,
      todayShare,
    };
  }, [schedules]);

  const kpis = [
    {
      label: "Total Jadwal Shift",
      value: `${metrics.totalCount} jadwal`,
      description: "Seluruh penugasan shift terdaftar",
      icon: IconCalendarEvent,
    },
    {
      label: "Shift Hari Ini",
      value: `${metrics.todayCount} staf`,
      description: `${metrics.todayShare}% dari total penugasan`,
      icon: IconClock,
    },
    {
      label: "Staf Sedang Bertugas",
      value: `${metrics.onDutyCount} staf aktif`,
      description: "Staf operasional saat ini",
      icon: IconUserCheck,
    },
    {
      label: "Distribusi Shift",
      value: `${metrics.morningCount} / ${metrics.afternoonCount} / ${metrics.nightCount}`,
      description: "Pagi / Siang / Malam",
      icon: IconSun,
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
