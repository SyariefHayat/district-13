import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ScheduleHeader } from "../components/ScheduleHeader";
import { ScheduleStatsCards } from "../components/ScheduleStatsCards";
import { ScheduleTable } from "../components/ScheduleTable";
import { ScheduleFormDialog } from "../components/ScheduleFormDialog";
import { useScheduleData } from "../hooks/useScheduleData";
import type { ScheduleItem } from "../data/scheduleData";

export default function SchedulePage() {
  const {
    schedules,
    isLoading,
    error,
    refetch,
    createSchedule,
    updateSchedule,
    updateScheduleStatus,
    deleteSchedule,
    deleteMultiple,
  } = useScheduleData();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] =
    React.useState<ScheduleItem | null>(null);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setDialogOpen(true);
  };

  const handleExport = (selectedSchedules?: ScheduleItem[]) => {
    const listToExport =
      selectedSchedules && selectedSchedules.length > 0
        ? selectedSchedules
        : schedules;

    if (!listToExport.length) {
      toast.add({ title: "Tidak ada jadwal shift untuk diekspor" });
      return;
    }

    const exportData = listToExport.map((s) => ({
      ID: s.id,
      "Nama Karyawan": s.userName,
      Peran: s.userRole,
      Shift: s.shiftName,
      "Tipe Shift": s.shiftType,
      Tanggal: s.date,
      "Jam Mulai": s.startTime,
      "Jam Selesai": s.endTime,
      Status: s.status,
      Catatan: s.notes || "-",
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jadwal-shift-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} jadwal shift`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ScheduleHeader
        onExport={() => handleExport()}
        onAddSchedule={handleOpenAdd}
      />

      {error && (
        <div className="mx-4 md:mx-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="size-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-1.5"
          >
            <IconRefresh className="size-4" />
            <span>Coba lagi</span>
          </Button>
        </div>
      )}

      <ScheduleStatsCards schedules={schedules} isLoading={isLoading} />

      <ScheduleTable
        schedules={schedules}
        isLoading={isLoading}
        onEditSchedule={handleOpenEdit}
        onUpdateStatus={updateScheduleStatus}
        onDeleteSchedule={deleteSchedule}
        onDeleteMultiple={deleteMultiple}
        onExport={handleExport}
      />

      <ScheduleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={editingSchedule}
        onSubmit={async (values) => {
          if (editingSchedule) {
            return await updateSchedule(editingSchedule.id, values);
          } else {
            return await createSchedule(values);
          }
        }}
      />
    </div>
  );
}
