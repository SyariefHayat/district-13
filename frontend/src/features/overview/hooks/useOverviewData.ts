import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { useAuth } from "@/context/auth-context";

// ---------- API response types ----------

interface KpiMetric {
  value: number;
  previous: number;
  change: number;
}

export interface OverviewApiResponse {
  period: { startDate: string; endDate: string };
  kpis: {
    sales: KpiMetric;
    netProfit: KpiMetric;
    transactions: KpiMetric;
    avgTransaction: KpiMetric;
  };
  dailySales: { date: string; totalSales: number; transactionCount: number }[];
  products: {
    productId: string;
    productName: string;
    categoryName: string;
    quantitySold: number;
    totalSales: number;
  }[];
  hourlyHeatmap: {
    dow: number;
    hour: number;
    transactionCount: number;
    totalSales: number;
  }[];
}

// ---------- Hook ----------

export function useOverviewData(date: DateRange | undefined, _preset: string) {
  const { authorizedFetch } = useAuth();
  const [data, setData] = useState<OverviewApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : null;
  const endDate = date?.from
    ? format(date.to ?? date.from, "yyyy-MM-dd")
    : null;

  const fetchOverview = useCallback(async () => {
    if (!startDate || !endDate) return;

    // Cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authorizedFetch(
        `/reports/overview?startDate=${startDate}&endDate=${endDate}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          typeof body.message === "string"
            ? body.message
            : `Request failed (${response.status})`
        );
      }

      const json = (await response.json()) as OverviewApiResponse;
      if (!controller.signal.aborted) {
        setData(json);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [startDate, endDate, authorizedFetch]);

  useEffect(() => {
    void fetchOverview();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchOverview]);

  return { data, isLoading, error, refetch: fetchOverview };
}
