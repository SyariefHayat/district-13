import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  calculateProfitSummary,
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

const INITIAL_SUMMARY: ProfitReportSummary = {
  netRevenue: 0,
  totalCogs: 0,
  grossProfit: 0,
  profitMargin: 0,
  totalUnitsSold: 0,
  productCount: 0,
};

export function useProfitReportData(options?: UseProfitReportDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();

  const [summary, setSummary] = useState<ProfitReportSummary>(INITIAL_SUMMARY);
  const [products, setProducts] = useState<ProductProfitItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProfitReportFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Fetch categories
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
          const names = catList
            .filter((c: any) => c.isActive !== false)
            .map((c: { name: string }) => c.name);
          setCategories(["Semua Kategori", ...names]);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authorizedFetch]);

  const fetchProfitReport = useCallback(
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
        if (filters.category && filters.category !== "Semua Kategori") {
          queryParams.set("category", filters.category);
        }

        const response = await authorizedFetch(
          `/reports/profit?${queryParams.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message ||
            `Gagal memuat analitik profit (${response.status})`;
          throw new Error(
            Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
          );
        }

        const json = await response.json();

        // Parse products
        const rawProducts: any[] = Array.isArray(json?.products?.data)
          ? json.products.data
          : Array.isArray(json?.data)
            ? json.data
            : [];

        const freshProducts: ProductProfitItem[] = rawProducts.map((p) => {
          const sellingPrice = Number(p.sellingPrice || 0);
          const costPrice = Number(p.costPrice || 0);
          const unitsSold = Number(p.unitsSold || 0);
          const totalRevenue = Number(
            p.totalRevenue ?? unitsSold * sellingPrice
          );
          const totalCogs = Number(p.totalCogs ?? unitsSold * costPrice);
          const grossProfit = Number(p.grossProfit ?? totalRevenue - totalCogs);
          const margin =
            p.profitMargin !== undefined
              ? Number(p.profitMargin)
              : totalRevenue > 0
                ? Number(((grossProfit / totalRevenue) * 100).toFixed(1))
                : 0;

          return {
            id: p.id || `prf-${p.sku || Math.random()}`,
            name: p.name || p.productName || "Produk",
            sku: p.sku || "-",
            category: p.category || p.categoryName || "Umum",
            unitsSold,
            sellingPrice,
            costPrice,
            totalRevenue,
            totalCogs,
            grossProfit,
            profitMargin: margin,
          };
        });

        // Parse or compute summary
        let freshSummary: ProfitReportSummary;
        if (json?.summary) {
          freshSummary = {
            netRevenue: Number(
              json.summary.netRevenue ?? json.summary.totalRevenue ?? 0
            ),
            totalCogs: Number(json.summary.totalCogs ?? 0),
            grossProfit: Number(json.summary.grossProfit ?? 0),
            profitMargin: Number(json.summary.profitMargin ?? 0),
            totalUnitsSold: Number(json.summary.totalUnitsSold ?? 0),
            productCount: Number(
              json.summary.productCount ?? freshProducts.length
            ),
          };
        } else {
          freshSummary = calculateProfitSummary(freshProducts);
        }

        const totalCount =
          typeof json?.products?.total === "number"
            ? json.products.total
            : freshProducts.length;

        setProducts(freshProducts);
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
            : "Terjadi kesalahan memuat analitik profit dari backend"
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
    void fetchProfitReport(false);

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        void fetchProfitReport(true);
      }, pollIntervalMs);

      return () => {
        clearInterval(interval);
        abortRef.current?.abort();
      };
    }
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
    isSyncing,
    lastSyncedAt,
    error,
    filters,
    pagination,
    setFilters: updateFilters,
    clearFilters,
    setPage,
    setLimit,
    refetch: () => fetchProfitReport(false),
    authorizedFetch,
  };
}
