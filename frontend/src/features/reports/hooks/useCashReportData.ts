import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  calculateCashSummary,
  mapBackendCashMovement,
  SAMPLE_CASH_MOVEMENTS,
  SAMPLE_CASH_SUMMARY,
  type BackendCashReportResponse,
  type CashMovementItem,
  type CashReportSummary,
} from "../data/cashReportData";

export interface CashReportFilters {
  startDate?: string;
  endDate?: string;
  type?: "IN" | "OUT" | "";
  userId?: string;
}

export interface UseCashReportDataOptions {
  pollIntervalMs?: number;
}

const DEFAULT_USERS = [
  { id: "usr-01", name: "Siti Rahma" },
  { id: "usr-02", name: "Budi Santoso" },
  { id: "usr-03", name: "Ahmad Fauzi" },
  { id: "usr-04", name: "Dewi Lestari" },
];

export function useCashReportData(options?: UseCashReportDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();

  const [summary, setSummary] =
    useState<CashReportSummary>(SAMPLE_CASH_SUMMARY);
  const [movements, setMovements] = useState<CashMovementItem[]>(
    SAMPLE_CASH_MOVEMENTS
  );
  const [users, setUsers] =
    useState<Array<{ id: string; name: string }>>(DEFAULT_USERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CashReportFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: SAMPLE_CASH_MOVEMENTS.length,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Fetch users for cashier/recordedBy lookup
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

  const fetchCashReport = useCallback(
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
        if (filters.type) params.set("type", filters.type);
        if (filters.userId) params.set("userId", filters.userId);

        const response = await authorizedFetch(
          `/reports/cash?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          return;
        }

        const data: BackendCashReportResponse = await response.json();

        const userMap = new Map<string, string>();
        users.forEach((u) => userMap.set(u.id, u.name));

        if (data.movements?.data && Array.isArray(data.movements.data)) {
          const mapped = data.movements.data.map((m) =>
            mapBackendCashMovement(m, userMap)
          );
          setMovements(mapped);
          setSummary(calculateCashSummary(mapped, data));
          setPagination((prev) => ({
            ...prev,
            total: Number(data.movements?.total ?? mapped.length),
          }));
        } else if (data.cashIn !== undefined || data.cashOut !== undefined) {
          const cashInVal = Number(data.cashIn) || 0;
          const cashOutVal = Number(data.cashOut) || 0;
          setSummary((prev) => ({
            ...prev,
            totalCashIn: cashInVal > 0 ? cashInVal : prev.totalCashIn,
            totalCashOut: cashOutVal > 0 ? cashOutVal : prev.totalCashOut,
            netCashFlow:
              cashInVal > 0 || cashOutVal > 0
                ? cashInVal - cashOutVal
                : prev.netCashFlow,
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
      filters.type,
      filters.userId,
      users,
    ]
  );

  useEffect(() => {
    void fetchCashReport(false);
  }, [fetchCashReport]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      void fetchCashReport(true);
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchCashReport, pollIntervalMs]);

  const updateFilters = useCallback(
    (newFilters: Partial<CashReportFilters>) => {
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
    movements,
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
    refetch: () => fetchCashReport(false),
  };
}
