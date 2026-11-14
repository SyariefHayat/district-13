import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  calculateShiftSummary,
  mapBackendShiftReportItem,
  SAMPLE_SHIFT_REPORT_ITEMS,
  SAMPLE_SHIFT_REPORT_SUMMARY,
  type BackendShiftReportResponse,
  type ShiftReportItem,
  type ShiftReportSummary,
} from "../data/shiftReportData";

export interface ShiftReportFilters {
  startDate?: string;
  endDate?: string;
  status?: "OPEN" | "CLOSED" | "";
  userId?: string;
}

export interface UseShiftReportDataOptions {
  pollIntervalMs?: number;
}

const DEFAULT_USERS = [
  { id: "usr-01", name: "Siti Rahma" },
  { id: "usr-02", name: "Budi Santoso" },
  { id: "usr-03", name: "Ahmad Fauzi" },
  { id: "usr-04", name: "Dewi Lestari" },
];

export function useShiftReportData(options?: UseShiftReportDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();

  const [summary, setSummary] = useState<ShiftReportSummary>(
    SAMPLE_SHIFT_REPORT_SUMMARY
  );
  const [shifts, setShifts] = useState<ShiftReportItem[]>(
    SAMPLE_SHIFT_REPORT_ITEMS
  );
  const [users, setUsers] =
    useState<Array<{ id: string; name: string }>>(DEFAULT_USERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ShiftReportFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: SAMPLE_SHIFT_REPORT_ITEMS.length,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Fetch users for cashier name lookup
  useEffect(() => {
    let active = true;
    authorizedFetch("/users?limit=100")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const userList = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        if (active && userList.length > 0) {
          setUsers(
            userList.map(
              (u: { id: string; name: string; username?: string }) => ({
                id: u.id,
                name: u.name || u.username || "Karyawan",
              })
            )
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authorizedFetch]);

  const fetchShiftReport = useCallback(
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
        const params = new URLSearchParams();
        params.set("page", String(pagination.page));
        params.set("limit", String(pagination.limit));
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);
        if (filters.status) params.set("status", filters.status);
        if (filters.userId) params.set("userId", filters.userId);

        const response = await authorizedFetch(
          `/reports/shifts?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          return;
        }

        const json: BackendShiftReportResponse = await response.json();

        if (json.data && Array.isArray(json.data)) {
          const userMap = new Map<string, string>();
          users.forEach((u) => userMap.set(u.id, u.name));

          const mappedShifts: ShiftReportItem[] = json.data.map((s) =>
            mapBackendShiftReportItem(s, userMap)
          );

          setShifts(mappedShifts);
          setSummary(calculateShiftSummary(mappedShifts, json.summary));
          setPagination((prev) => ({
            ...prev,
            total: Number(json.total ?? mappedShifts.length),
          }));
        }

        setLastSyncedAt(new Date());
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
        isInitialLoad.current = false;
      }
    },
    [
      authorizedFetch,
      pagination.page,
      pagination.limit,
      filters.startDate,
      filters.endDate,
      filters.status,
      filters.userId,
      users,
    ]
  );

  useEffect(() => {
    void fetchShiftReport(false);
  }, [fetchShiftReport]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      void fetchShiftReport(true);
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchShiftReport, pollIntervalMs]);

  const updateFilters = useCallback(
    (newFilters: Partial<ShiftReportFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  return {
    summary,
    shifts,
    users,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    filters,
    pagination,
    setFilters: updateFilters,
    clearFilters,
    setPage,
    setLimit,
    refetch: () => fetchShiftReport(false),
  };
}
