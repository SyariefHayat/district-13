import * as React from "react";
import { toast } from "@/components/ui/toast";
import {
  INITIAL_SCHEDULES,
  type ScheduleItem,
  type ScheduleStatus,
  type ShiftType,
} from "../data/scheduleData";

const STORAGE_KEY = "pos_shift_schedules";

export interface CreateScheduleInput {
  userId: string;
  userName: string;
  userRole: "OWNER" | "ADMIN" | "CASHIER";
  shiftType: ShiftType;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  notes?: string;
}

export function useScheduleData() {
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ScheduleItem[];
      }
    } catch {
      // ignore
    }
    return INITIAL_SCHEDULES;
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync to local storage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch {
      // ignore
    }
  }, [schedules]);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulated fetch delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSchedules(JSON.parse(stored) as ScheduleItem[]);
      } else {
        setSchedules(INITIAL_SCHEDULES);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat jadwal shift"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSchedule = React.useCallback(
    async (input: CreateScheduleInput): Promise<boolean> => {
      try {
        const newSchedule: ScheduleItem = {
          ...input,
          id: `sch-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSchedules((prev) => [newSchedule, ...prev]);
        toast.add({
          title: "Jadwal shift berhasil ditambahkan",
          description: `Shift untuk ${input.userName} pada ${input.date} berhasil disimpan.`,
        });
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal menambahkan jadwal shift",
          description:
            err instanceof Error ? err.message : "Terjadi kesalahan.",
        });
        return false;
      }
    },
    []
  );

  const updateSchedule = React.useCallback(
    async (
      id: string,
      input: Partial<CreateScheduleInput>
    ): Promise<boolean> => {
      try {
        setSchedules((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
        toast.add({
          title: "Jadwal shift berhasil diperbarui",
        });
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal memperbarui jadwal shift",
          description:
            err instanceof Error ? err.message : "Terjadi kesalahan.",
        });
        return false;
      }
    },
    []
  );

  const updateScheduleStatus = React.useCallback(
    async (id: string, status: ScheduleStatus): Promise<boolean> => {
      try {
        setSchedules((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
        toast.add({
          title: "Status jadwal berhasil diperbarui",
        });
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal memperbarui status",
          description:
            err instanceof Error ? err.message : "Terjadi kesalahan.",
        });
        return false;
      }
    },
    []
  );

  const deleteSchedule = React.useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setSchedules((prev) => prev.filter((item) => item.id !== id));
        toast.add({
          title: "Jadwal shift berhasil dihapus",
        });
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal menghapus jadwal shift",
          description:
            err instanceof Error ? err.message : "Terjadi kesalahan.",
        });
        return false;
      }
    },
    []
  );

  const deleteMultiple = React.useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        setSchedules((prev) => prev.filter((item) => !ids.includes(item.id)));
        toast.add({
          title: `Berhasil menghapus ${ids.length} jadwal shift`,
        });
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal menghapus jadwal shift",
          description:
            err instanceof Error ? err.message : "Terjadi kesalahan.",
        });
        return false;
      }
    },
    []
  );

  return {
    schedules,
    isLoading,
    error,
    refetch,
    createSchedule,
    updateSchedule,
    updateScheduleStatus,
    deleteSchedule,
    deleteMultiple,
  };
}
