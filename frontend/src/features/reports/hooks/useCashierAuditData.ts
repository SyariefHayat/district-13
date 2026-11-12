import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  calculateCashierAuditSummary,
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

  const [summary, setSummary] = useState<CashierAuditSummary>(
    SAMPLE_CASHIER_AUDIT_SUMMARY
  );
  const [cashiers, setCashiers] = useState<CashierAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CashierAuditFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  const fetchCashierAudit = useCallback(
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

        const response = await authorizedFetch(
          `/reports/cashiers?${queryParams.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal memuat audit kasir (${response.status})`;
          throw new Error(
            Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
          );
        }

        const json = await response.json();

        const rawList: any[] = Array.isArray(json?.cashiers?.data)
          ? json.cashiers.data
          : Array.isArray(json?.data)
            ? json.data
            : [];

        const mappedItems: CashierAuditItem[] = rawList.map((item, idx) => ({
          id: item.id || `ca-${item.cashierId || idx}`,
          cashierId: item.cashierId,
          cashierName: item.cashierName || "Kasir",
          cashierCode:
            item.cashierCode || `KSR-${String(idx + 1).padStart(3, "0")}`,
          role: item.role || "Kasir",
          totalShifts: Number(item.totalShifts || 0),
          totalTransactions: Number(item.totalTransactions || 0),
          totalSales: Number(item.totalSales || 0),
          cashExpected: Number(item.cashExpected || 0),
          cashActual: Number(item.cashActual || 0),
          cashDifference: Number(item.cashDifference || 0),
          accuracyRate: Number(item.accuracyRate ?? 100),
          voidCount: Number(item.voidCount || 0),
          voidAmount: Number(item.voidAmount || 0),
          discountCount: Number(item.discountCount || 0),
          discountAmount: Number(item.discountAmount || 0),
          auditStatus:
            (item.auditStatus as "NORMAL" | "WARNING" | "CRITICAL") || "NORMAL",
          lastAuditDate: item.lastAuditDate || new Date().toISOString(),
          notes: item.notes || "Performa kasir tercatat dalam sistem.",
        }));

        const filtered = filters.auditStatus
          ? mappedItems.filter((i) => i.auditStatus === filters.auditStatus)
          : mappedItems;

        let freshSummary: CashierAuditSummary;
        if (json?.summary) {
          freshSummary = {
            totalCashiers: Number(
              json.summary.totalCashiers ?? mappedItems.length
            ),
            totalTransactions: Number(json.summary.totalTransactions ?? 0),
            totalSales: Number(json.summary.totalSales ?? 0),
            totalDifference: Number(json.summary.totalDifference ?? 0),
            averageAccuracy: Number(json.summary.averageAccuracy ?? 100),
            totalVoidCount: Number(json.summary.totalVoidCount ?? 0),
            totalVoidAmount: Number(json.summary.totalVoidAmount ?? 0),
          };
        } else {
          freshSummary = calculateCashierAuditSummary(mappedItems);
        }

        const totalCount =
          typeof json?.cashiers?.total === "number"
            ? json.cashiers.total
            : mappedItems.length;

        setCashiers(filtered);
        setSummary(freshSummary);
        setPagination((prev) => ({
          ...prev,
          total: totalCount,
        }));
        setLastSyncedAt(new Date());
        setError(null);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;

        setError(
          err instanceof Error
            ? `Backend: ${err.message}`
            : "Terjadi kesalahan memuat audit kasir dari backend"
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
    void fetchCashierAudit(false);

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        void fetchCashierAudit(true);
      }, pollIntervalMs);

      return () => {
        clearInterval(interval);
        abortRef.current?.abort();
      };
    }
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
    isSyncing,
    lastSyncedAt,
    error,
    filters,
    pagination,
    setFilters: updateFilters,
    clearFilters,
    setPage,
    setLimit,
    refetch: () => fetchCashierAudit(false),
    authorizedFetch,
  };
}
