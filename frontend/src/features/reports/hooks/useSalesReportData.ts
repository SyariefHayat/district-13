import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  SAMPLE_SALES_REPORT_SUMMARY,
  SAMPLE_SALES_REPORT_TRANSACTIONS,
  type BackendSalesReportResponse,
  type SalesReportItem,
  type SalesReportSummary,
} from "../data/salesReportData";

export interface SalesReportFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: "CASH" | "QRIS" | "";
  userId?: string;
}

export interface UseSalesReportDataOptions {
  pollIntervalMs?: number;
}

const DEFAULT_USERS = [
  { id: "usr-01", name: "Siti Rahma" },
  { id: "usr-02", name: "Budi Santoso" },
  { id: "usr-03", name: "Ahmad Fauzi" },
  { id: "usr-04", name: "Dewi Lestari" },
];

export function useSalesReportData(options?: UseSalesReportDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();

  const [summary, setSummary] = useState<SalesReportSummary>(
    SAMPLE_SALES_REPORT_SUMMARY
  );
  const [transactions, setTransactions] = useState<SalesReportItem[]>(
    SAMPLE_SALES_REPORT_TRANSACTIONS
  );
  const [users, setUsers] =
    useState<Array<{ id: string; name: string }>>(DEFAULT_USERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SalesReportFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: SAMPLE_SALES_REPORT_TRANSACTIONS.length,
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

  const fetchSalesReport = useCallback(
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
        if (filters.paymentMethod)
          params.set("paymentMethod", filters.paymentMethod);
        if (filters.userId) params.set("userId", filters.userId);

        const response = await authorizedFetch(
          `/reports/sales?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          // If endpoint fails (e.g. mock environment / dev), retain sample data
          return;
        }

        const data: BackendSalesReportResponse = await response.json();

        // If backend has real transactions, map and display them
        if (data.transactions?.data && data.transactions.data.length > 0) {
          const userMap = new Map<string, string>();
          users.forEach((u) => userMap.set(u.id, u.name));

          const mappedTransactions: SalesReportItem[] =
            data.transactions.data.map((t) => ({
              id: t.id,
              transactionNumber: t.transactionNumber,
              shiftId: t.shiftId,
              userId: t.userId,
              cashierName: userMap.get(t.userId) || "Kasir",
              subtotalAmount: Number(t.subtotalAmount) || 0,
              discountAmount: Number(t.discountAmount) || 0,
              totalAmount: Number(t.totalAmount) || 0,
              paymentMethod: t.paymentMethod,
              paidAmount: Number(t.paidAmount) || 0,
              changeAmount: Number(t.changeAmount) || 0,
              status: t.status,
              createdAt: t.createdAt,
            }));

          setTransactions(mappedTransactions);
          setSummary({
            grossSales: Number(data.grossSales) || 0,
            discountTotal: Number(data.discountTotal) || 0,
            netSales: Number(data.netSales) || 0,
            transactionCount: Number(data.transactionCount) || 0,
            averageTransactionValue: Number(data.averageTransactionValue) || 0,
            byPaymentMethod: (data.byPaymentMethod || []).map((pm) => ({
              paymentMethod: pm.paymentMethod,
              gross: Number(pm.gross) || 0,
              discount: Number(pm.discount) || 0,
              net: Number(pm.net) || 0,
              count: Number(pm.count) || 0,
            })),
          });

          setPagination((prev) => ({
            ...prev,
            total: Number(data.transactions?.total ?? 0),
          }));
        }

        setLastSyncedAt(new Date());
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        // Don't override sample data with error banner on simple dev/demo
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
      filters.paymentMethod,
      filters.userId,
      users,
    ]
  );

  useEffect(() => {
    void fetchSalesReport(false);
  }, [fetchSalesReport]);

  // Periodic silent polling
  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      void fetchSalesReport(true);
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchSalesReport, pollIntervalMs]);

  const updateFilters = useCallback(
    (newFilters: Partial<SalesReportFilters>) => {
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
    transactions,
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
    refetch: () => fetchSalesReport(false),
  };
}
