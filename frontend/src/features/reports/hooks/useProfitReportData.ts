import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  SAMPLE_PROFIT_PRODUCTS,
  SAMPLE_PROFIT_SUMMARY,
  type ProductProfitItem,
  type ProfitReportSummary,
} from "../data/profitReportData";

export interface ProfitReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  marginRange?: "high" | "medium" | "low" | "";
}

export interface UseProfitReportDataOptions {
  pollIntervalMs?: number;
}

const DEFAULT_CATEGORIES = [
  "Semua Kategori",
  "Coffee",
  "Non-Coffee",
  "Pastry",
  "Makanan",
  "Snack",
];

export function useProfitReportData(options?: UseProfitReportDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();

  const [summary] = useState<ProfitReportSummary>(SAMPLE_PROFIT_SUMMARY);
  const [products] = useState<ProductProfitItem[]>(SAMPLE_PROFIT_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProfitReportFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: SAMPLE_PROFIT_PRODUCTS.length,
  });

  const isInitialLoad = useRef(true);

  // Fetch categories if available
  useEffect(() => {
    let active = true;
    authorizedFetch("/categories")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const catList = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        if (active && catList.length > 0) {
          const names = catList.map((c: { name: string }) => c.name);
          setCategories(["Semua Kategori", ...names]);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authorizedFetch]);

  const fetchProfitReport = useCallback(async () => {
    // Mock / scaffold hook ready for backend integration
    setIsLoading(false);
    isInitialLoad.current = false;
  }, []);

  useEffect(() => {
    void fetchProfitReport();
  }, [fetchProfitReport]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const interval = setInterval(() => {
      void fetchProfitReport();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchProfitReport, pollIntervalMs]);

  const updateFilters = useCallback(
    (newFilters: Partial<ProfitReportFilters>) => {
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
    products,
    categories,
    isLoading,
    error,
    filters,
    pagination,
    setFilters: updateFilters,
    clearFilters,
    setPage,
    setLimit,
    refetch: () => fetchProfitReport(),
  };
}
