import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  SAMPLE_AUDIT_LOG_SUMMARY,
  mapBackendAuditLog,
  calculateAuditLogSummary,
  type AuditLogItem,
  type AuditLogSummary,
  type BackendAuditLog,
} from "../data/auditLogData";

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  entityType?: string;
  action?: string;
}

export interface UseAuditLogDataOptions {
  pollIntervalMs?: number;
}

export function useAuditLogData(options?: UseAuditLogDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();

  const [summary, setSummary] = useState<AuditLogSummary>(
    SAMPLE_AUDIT_LOG_SUMMARY
  );
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  const fetchAuditLogs = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) {
        setIsLoading(true);
      }
      setIsSyncing(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", String(pagination.page));
        queryParams.set("limit", String(pagination.limit));

        if (filters.startDate) queryParams.set("startDate", filters.startDate);
        if (filters.endDate) queryParams.set("endDate", filters.endDate);
        if (filters.entityType)
          queryParams.set("entityType", filters.entityType);
        if (filters.action) queryParams.set("action", filters.action);

        const response = await authorizedFetch(
          `/audit-logs?${queryParams.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message ||
            `Gagal memuat catatan audit log (${response.status})`;
          throw new Error(
            Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
          );
        }

        const json = await response.json();
        const rawList: BackendAuditLog[] = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];

        const freshLogs = rawList.map(mapBackendAuditLog);
        const total =
          typeof json.total === "number" ? json.total : freshLogs.length;

        setLogs(freshLogs);
        setSummary(calculateAuditLogSummary(freshLogs, total));
        setPagination((prev) => ({
          ...prev,
          total,
        }));
        setLastSyncedAt(new Date());
        setError(null);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;

        setError(
          err instanceof Error
            ? `Backend: ${err.message}`
            : "Terjadi kesalahan memuat data audit log dari backend"
        );
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsLoading(false);
          setIsSyncing(false);
          isInitialLoad.current = false;
        }
      }
    },
    [authorizedFetch, filters, pagination.page, pagination.limit]
  );

  useEffect(() => {
    void fetchAuditLogs(false);

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        void fetchAuditLogs(true);
      }, pollIntervalMs);

      return () => {
        clearInterval(interval);
        abortRef.current?.abort();
      };
    }
  }, [fetchAuditLogs, pollIntervalMs]);

  const updateFilters = useCallback((newFilters: Partial<AuditLogFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

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
    logs,
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
    refetch: () => fetchAuditLogs(false),
    authorizedFetch,
  };
}
