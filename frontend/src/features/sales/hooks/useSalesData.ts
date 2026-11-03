import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import {
  mapBackendTransaction,
  type BackendTransaction,
  type SaleTransaction,
  type SalesStats,
} from "../data/salesData";

export interface UseSalesDataOptions {
  pollIntervalMs?: number;
}

function areTransactionListsEqual(
  a: SaleTransaction[],
  b: SaleTransaction[]
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const item1 = a[i];
    const item2 = b[i];
    if (
      item1.id !== item2.id ||
      item1.status !== item2.status ||
      item1.totalAmount !== item2.totalAmount ||
      item1.voidReason !== item2.voidReason ||
      item1.createdAt !== item2.createdAt
    ) {
      return false;
    }
  }
  return true;
}

export function useSalesData(options?: UseSalesDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 3000;
  const { authorizedFetch } = useAuth();

  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  const fetchTransactions = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) {
        setIsLoading(true);
      }
      setIsSyncing(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await authorizedFetch("/transactions?limit=100", {
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal memuat transaksi (${response.status})`;
          throw new Error(
            Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
          );
        }

        const json = await response.json();
        const rawList: BackendTransaction[] = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        const freshTransactions = rawList.map(mapBackendTransaction);

        // Update with authentic realtime data from backend
        setTransactions((current) => {
          if (areTransactionListsEqual(current, freshTransactions)) {
            return current;
          }
          return freshTransactions;
        });

        setLastSyncedAt(new Date());
        setError(null);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;

        setError(
          err instanceof Error
            ? `Backend: ${err.message}`
            : "Terjadi kesalahan memuat data backend"
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
    [authorizedFetch]
  );

  // Initial load and realtime polling
  useEffect(() => {
    void fetchTransactions(false);

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        void fetchTransactions(true);
      }, pollIntervalMs);

      return () => {
        clearInterval(interval);
        abortRef.current?.abort();
      };
    }
  }, [fetchTransactions, pollIntervalMs]);

  // Realtime single transaction detail fetcher
  const getTransactionDetail = useCallback(
    async (id: string): Promise<SaleTransaction | null> => {
      try {
        const response = await authorizedFetch(`/transactions/${id}`);
        if (!response.ok) {
          throw new Error("Gagal mengambil rincian transaksi dari server");
        }
        const data: BackendTransaction = await response.json();
        return mapBackendTransaction(data);
      } catch {
        const local = transactions.find((t) => t.id === id);
        return local || null;
      }
    },
    [authorizedFetch, transactions]
  );

  // Realtime void transaction to backend
  const voidTransaction = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      try {
        const response = await authorizedFetch(`/transactions/${id}/void`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal membatalkan transaksi (${response.status})`;
          throw new Error(
            Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
          );
        }

        toast.add({
          title: "Transaksi Dibatalkan (Void)",
          description:
            "Status transaksi berhasil diperbarui di server backend.",
        });

        // Optimistically update local state & immediately re-sync from backend
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  status: "VOIDED",
                  voidReason: reason,
                  voidedAt: new Date().toISOString(),
                }
              : tx
          )
        );

        await fetchTransactions(true);
        return true;
      } catch (err: unknown) {
        toast.add({
          title: "Gagal membatalkan transaksi",
          description:
            err instanceof Error ? err.message : "Kesalahan server backend",
        });
        return false;
      }
    },
    [authorizedFetch, fetchTransactions]
  );

  // Compute stats in realtime
  const stats: SalesStats = useMemo(() => {
    let totalRevenue = 0;
    let cashRevenue = 0;
    let qrisRevenue = 0;
    let completedCount = 0;
    let voidedCount = 0;

    for (const tx of transactions) {
      if (tx.status === "COMPLETED") {
        completedCount++;
        totalRevenue += tx.totalAmount;
        if (tx.paymentMethod === "CASH") cashRevenue += tx.totalAmount;
        if (tx.paymentMethod === "QRIS") qrisRevenue += tx.totalAmount;
      } else if (tx.status === "VOIDED") {
        voidedCount++;
      }
    }

    return {
      totalTransactions: transactions.length,
      totalRevenue,
      cashRevenue,
      qrisRevenue,
      completedCount,
      voidedCount,
    };
  }, [transactions]);

  return {
    transactions,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    stats,
    refetch: () => fetchTransactions(false),
    getTransactionDetail,
    voidTransaction,
  };
}
