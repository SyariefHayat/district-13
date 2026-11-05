import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  SAMPLE_AUDIT_LOGS,
  SAMPLE_AUDIT_LOG_SUMMARY,
  type AuditLogItem,
  type AuditLogSummary,
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

  const [summary] = useState<AuditLogSummary>(SAMPLE_AUDIT_LOG_SUMMARY);
  const [logs] = useState<AuditLogItem[]>(SAMPLE_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: SAMPLE_AUDIT_LOGS.length,
  });

  const isInitialLoad = useRef(true);

  const fetchAuditLogs = useCallback(async () => {
    // Scaffold hook ready for backend integration
    setIsLoading(false);
    isInitialLoad.current = false;
  }, []);

  useEffect(() => {
    void fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      void fetchAuditLogs();
    }, pollIntervalMs);
    return () => clearInterval(interval);
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
    error,
    filters,
    pagination,
    setFilters: updateFilters,
    clearFilters,
    setPage,
    setLimit,
    refetch: () => fetchAuditLogs(),
    authorizedFetch,
  };
}
