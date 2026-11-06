import { Link } from "react-router";
import {
  IconArrowRight,
  IconCalendar,
  IconCalendarTime,
  IconClock,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "../data/cashierData";
import type { CashierSchedule } from "../data/cashierData";

interface CashierScheduleCardProps {
  schedules: CashierSchedule[];
  todaySchedule: CashierSchedule | null;
  isLoading: boolean;
}

export function CashierScheduleCard({
  schedules,
  todaySchedule,
  isLoading,
}: CashierScheduleCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <IconCalendarTime className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Jadwal Kerja Kasir
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Agenda shift dan jam penugasan kasir
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/dashboard/schedules" />}
          className="h-8 gap-1 text-xs text-primary font-medium"
        >
          <span>Lihat Semua</span>
          <IconArrowRight className="size-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Today's Active Schedule Highlight */}
        {todaySchedule ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <IconClock className="size-3.5" />
                Shift Hari Ini
              </span>
              <Badge variant="outline" className="text-[10px] bg-background">
                {todaySchedule.status}
              </Badge>
            </div>
            <p className="text-sm font-bold text-foreground">
              {todaySchedule.shiftName}
            </p>
            <p className="text-xs text-muted-foreground">
              Pukul {todaySchedule.startTime} s/d {todaySchedule.endTime} WIB
            </p>
            {todaySchedule.notes && (
              <p className="text-[11px] text-muted-foreground italic border-t pt-1 border-primary/10">
                Catatan: {todaySchedule.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground text-center">
            Tidak ada jadwal shift terdaftar untuk hari ini
          </div>
        )}

        {/* Upcoming Shift List */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-foreground">
            Shift Mendatang
          </span>
          <div className="divide-y divide-border/60 rounded-lg border overflow-hidden">
            {schedules.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {isLoading ? "Memuat jadwal..." : "Belum ada jadwal berikutnya"}
              </div>
            ) : (
              schedules.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/30 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IconCalendar className="size-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        {s.shiftName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateOnly(s.date)} • {s.startTime} - {s.endTime}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {s.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
