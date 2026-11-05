import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  SAMPLE_CASHIER_AUDITS,
  SAMPLE_CASHIER_AUDIT_SUMMARY,
  type CashierAuditItem,
  type CashierAuditSummary,
} from "../data/cashierAuditData";

export interface CashierAuditFilters {
  startDate?: string;
  endDate?: string;
  auditStatus?: "NORMAL" | "WARNING" | "CRITICAL" | "";
}

export interface UseCashierAuditDataOptions {
  pollIntervalMs?: number;
}

export function useCashierAuditData(options?: UseCashierAuditDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();

  const [summary] = useState<CashierAuditSummary>(SAMPLE_CASHIER_AUDIT_SUMMARY);
  const [cashiers] = useState<CashierAuditItem[]>(SAMPLE_CASHIER_AUDITS);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const [filters, setFilters] = useState<CashierAuditFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: SAMPLE_CASHIER_AUDITS.length,
  });

  const isInitialLoad = useRef(true);

  const fetchCashierAudit = useCallback(async () => {
    // Scaffold hook ready for backend integration
    setIsLoading(false);
    isInitialLoad.current = false;
  }, []);

  useEffect(() => {
    void fetchCashierAudit();
  }, [fetchCashierAudit]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      void fetchCashierAudit();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchCashierAudit, pollIntervalMs]);

  const updateFilters = useCallback(
    (newFilters: Partial<CashierAuditFilters>) => {
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
    cashiers,
    isLoading,
    error,
    filters,
    pagination,
    setFilters: updateFilters,
    clearFilters,
    setPage,
    setLimit,
    refetch: () => fetchCashierAudit(),
    authorizedFetch,
  };
}
