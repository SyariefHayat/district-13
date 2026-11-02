import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import {
  mapBackendSchedule,
  type BackendSchedule,
  type ScheduleItem,
  type ScheduleStatus,
  type ShiftType,
} from "../data/scheduleData";

export interface CreateScheduleInput {
  userId: string;
  userName?: string;
  userRole?: "OWNER" | "ADMIN" | "CASHIER";
  shiftType: ShiftType;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  notes?: string;
}

function areScheduleListsEqual(a: ScheduleItem[], b: ScheduleItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const item1 = a[i];
    const item2 = b[i];
    if (
      item1.id !== item2.id ||
      item1.userId !== item2.userId ||
      item1.userName !== item2.userName ||
      item1.userRole !== item2.userRole ||
      item1.shiftType !== item2.shiftType ||
      item1.shiftName !== item2.shiftName ||
      item1.date !== item2.date ||
      item1.startTime !== item2.startTime ||
      item1.endTime !== item2.endTime ||
      item1.status !== item2.status ||
      item1.notes !== item2.notes ||
      item1.updatedAt !== item2.updatedAt
    ) {
      return false;
    }
  }
  return true;
}

async function parseJsonResponse<T>(
  response: Response,
  defaultError: string
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = `${defaultError} (${response.status})`;
    if (isJson) {
      try {
        const body = await response.json();
        if (body?.message) {
          message = Array.isArray(body.message)
            ? body.message.join(", ")
            : String(body.message);
        }
      } catch {
        // Fallback to default message
      }
    }
    throw new Error(message);
  }

  if (!isJson) {
    throw new Error(
      "Respon server tidak valid (bukan JSON). Pastikan server backend aktif dan rute terdaftar."
    );
  }

  return (await response.json()) as T;
}

export interface UseScheduleDataOptions {
  pollIntervalMs?: number;
}

export function useScheduleData(options?: UseScheduleDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch, user: currentUser } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  const fetchSchedules = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) {
        setIsLoading(true);
      }
      setIsSyncing(true);
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await authorizedFetch("/schedules", {
          signal: controller.signal,
        });

        const rawData = await parseJsonResponse<BackendSchedule[]>(
          response,
          "Gagal memuat jadwal shift"
        );
        const fresh = Array.isArray(rawData)
          ? rawData.map(mapBackendSchedule)
          : [];

        if (!controller.signal.aborted) {
          setSchedules((current) => {
            if (areScheduleListsEqual(current, fresh)) {
              return current;
            }
            return fresh;
          });

          setLastSyncedAt(new Date());
          setError(null);
          isInitialLoad.current = false;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat jadwal shift.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsSyncing(false);
        }
      }
    },
    [authorizedFetch]
  );

  // Initial fetch and polling
  useEffect(() => {
    void fetchSchedules(false);

    if (pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchSchedules(true);
      }
    }, pollIntervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchSchedules(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      abortRef.current?.abort();
    };
  }, [fetchSchedules, pollIntervalMs]);

  const createSchedule = useCallback(
    async (input: CreateScheduleInput): Promise<boolean> => {
      try {
        const response = await authorizedFetch("/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: input.userId,
            shiftType: input.shiftType,
            shiftName: input.shiftName,
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime,
            status: input.status,
            notes: input.notes,
          }),
        });

        const created = await parseJsonResponse<BackendSchedule>(
          response,
          "Gagal menambahkan jadwal"
        );
        setSchedules((prev) => [mapBackendSchedule(created), ...prev]);
        toast.add({
          title: "Jadwal shift berhasil ditambahkan",
          description: `Jadwal untuk ${created.userName} berhasil disimpan ke database.`,
        });

        void fetchSchedules(true);
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
    [authorizedFetch, fetchSchedules]
  );

  const updateSchedule = useCallback(
    async (
      id: string,
      input: Partial<CreateScheduleInput>
    ): Promise<boolean> => {
      try {
        const response = await authorizedFetch(`/schedules/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const updated = await parseJsonResponse<BackendSchedule>(
          response,
          "Gagal memperbarui jadwal"
        );
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? mapBackendSchedule(updated) : s))
        );
        toast.add({
          title: "Jadwal shift berhasil diperbarui",
        });

        void fetchSchedules(true);
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
    [authorizedFetch, fetchSchedules]
  );

  const updateScheduleStatus = useCallback(
    async (id: string, status: ScheduleStatus): Promise<boolean> => {
      try {
        const response = await authorizedFetch(`/schedules/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        const updated = await parseJsonResponse<BackendSchedule>(
          response,
          "Gagal memperbarui status"
        );
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? mapBackendSchedule(updated) : s))
        );
        toast.add({
          title: "Status jadwal berhasil diperbarui",
        });

        void fetchSchedules(true);
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
    [authorizedFetch, fetchSchedules]
  );

  const deleteSchedule = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await authorizedFetch(`/schedules/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          await parseJsonResponse(response, "Gagal menghapus jadwal");
        }

        setSchedules((prev) => prev.filter((s) => s.id !== id));
        toast.add({
          title: "Jadwal shift berhasil dihapus",
        });

        void fetchSchedules(true);
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
    [authorizedFetch, fetchSchedules]
  );

  const deleteMultiple = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        const response = await authorizedFetch("/schedules/batch-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          await parseJsonResponse(response, "Gagal menghapus jadwal");
        }

        setSchedules((prev) => prev.filter((s) => !ids.includes(s.id)));
        toast.add({
          title: `Berhasil menghapus ${ids.length} jadwal shift`,
        });

        void fetchSchedules(true);
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
    [authorizedFetch, fetchSchedules]
  );

  return {
    schedules,
    currentUser,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    refetch: () => fetchSchedules(false),
    createSchedule,
    updateSchedule,
    updateScheduleStatus,
    deleteSchedule,
    deleteMultiple,
  };
}
