import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import {
  DEFAULT_PAYMENT_METHODS,
  type PaymentMethodItem,
} from "../data/paymentData";

export interface BackendPaymentMethodReport {
  paymentMethod: string;
  gross: string | number;
  discount: string | number;
  net: string | number;
  count: number;
}

export interface BackendSalesReport {
  grossSales?: string | number;
  discountTotal?: string | number;
  netSales?: string | number;
  transactionCount?: number;
  byPaymentMethod?: BackendPaymentMethodReport[];
}

export interface BackendTransaction {
  id: string;
  transactionNumber: string;
  totalAmount: string | number;
  paymentMethod: string;
  status: "COMPLETED" | "VOIDED";
  createdAt: string;
}

function arePaymentListsEqual(
  a: PaymentMethodItem[],
  b: PaymentMethodItem[]
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const item1 = a[i];
    const item2 = b[i];
    if (
      item1.id !== item2.id ||
      item1.name !== item2.name ||
      item1.code !== item2.code ||
      item1.type !== item2.type ||
      item1.provider !== item2.provider ||
      item1.accountNumber !== item2.accountNumber ||
      item1.feePercentage !== item2.feePercentage ||
      item1.settlementTime !== item2.settlementTime ||
      item1.transactionCount !== item2.transactionCount ||
      item1.totalVolume !== item2.totalVolume ||
      item1.status !== item2.status ||
      item1.isActive !== item2.isActive ||
      item1.minAmount !== item2.minAmount
    ) {
      return false;
    }
  }
  return true;
}

export interface UsePaymentDataOptions {
  pollIntervalMs?: number;
}

export function usePaymentData(options?: UsePaymentDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 3000;
  const { authorizedFetch } = useAuth();

  const [payments, setPayments] = useState<PaymentMethodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Clear legacy dummy caches if any
  useEffect(() => {
    localStorage.removeItem("district13_payment_methods");
    localStorage.removeItem("district13_payment_methods_v2");
  }, []);

  const fetchPaymentData = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) {
        setIsLoading(true);
      }
      setIsSyncing(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const methodStats = new Map<
          string,
          { volume: number; count: number }
        >();
        let gotDataFromBackend = false;

        // 1. Fetch live aggregate reports from backend (/reports/sales)
        try {
          const reportRes = await authorizedFetch("/reports/sales", {
            signal: controller.signal,
          });

          if (reportRes.ok) {
            const reportData: BackendSalesReport = await reportRes.json();
            if (Array.isArray(reportData.byPaymentMethod)) {
              for (const bpm of reportData.byPaymentMethod) {
                const key = (bpm.paymentMethod || "").toUpperCase();
                const vol = Number(bpm.net) || Number(bpm.gross) || 0;
                const cnt = Number(bpm.count) || 0;
                methodStats.set(key, { volume: vol, count: cnt });
              }
              gotDataFromBackend = true;
            }
          }
        } catch {
          // Handled via fallback
        }

        // 2. Fetch recent transactions from backend (/transactions?limit=100)
        try {
          const txRes = await authorizedFetch("/transactions?limit=100", {
            signal: controller.signal,
          });

          if (txRes.ok) {
            const txData = await txRes.json();
            const txList: BackendTransaction[] = Array.isArray(txData.data)
              ? txData.data
              : Array.isArray(txData)
                ? txData
                : [];

            if (!gotDataFromBackend) {
              for (const tx of txList) {
                if (tx.status === "COMPLETED") {
                  const m = (tx.paymentMethod || "CASH").toUpperCase();
                  const cur = methodStats.get(m) || { volume: 0, count: 0 };
                  cur.volume += Number(tx.totalAmount) || 0;
                  cur.count += 1;
                  methodStats.set(m, cur);
                }
              }
              gotDataFromBackend = true;
            }
          }
        } catch {
          // Handled below
        }

        if (controller.signal.aborted) return;

        // Construct authentic live payment method items based entirely on backend data
        const baseMethods = DEFAULT_PAYMENT_METHODS.map((dm) => {
          const key = dm.code.toUpperCase();
          const stats = methodStats.get(key) || { volume: 0, count: 0 };
          return {
            ...dm,
            totalVolume: stats.volume,
            transactionCount: stats.count,
            updatedAt: new Date().toISOString(),
          };
        });

        // Add any other payment methods that exist in backend transactions
        methodStats.forEach((stats, key) => {
          if (!baseMethods.some((m) => m.code.toUpperCase() === key)) {
            baseMethods.push({
              id: `pm-${key.toLowerCase()}`,
              name: key,
              code: key,
              type: key === "CASH" ? "CASH" : key === "QRIS" ? "QRIS" : "CARD",
              provider: "Backend Gateway",
              accountNumber: key,
              feePercentage: 0,
              settlementTime: "Real-time",
              transactionCount: stats.count,
              totalVolume: stats.volume,
              status: "ACTIVE",
              isActive: true,
              minAmount: 0,
              updatedAt: new Date().toISOString(),
            });
          }
        });

        setPayments((prev) => {
          // Preserve any user-toggled active/inactive status from previous state
          const merged = baseMethods.map((bm) => {
            const existing = prev.find(
              (p) => p.id === bm.id || p.code === bm.code
            );
            if (existing) {
              return {
                ...bm,
                name: existing.name || bm.name,
                provider: existing.provider || bm.provider,
                accountNumber: existing.accountNumber || bm.accountNumber,
                feePercentage: existing.feePercentage ?? bm.feePercentage,
                isActive: existing.isActive,
                status: existing.status,
              };
            }
            return bm;
          });

          // Include any custom user-added payment methods
          for (const p of prev) {
            if (!merged.some((m) => m.id === p.id || m.code === p.code)) {
              merged.push(p);
            }
          }

          return arePaymentListsEqual(prev, merged) ? prev : merged;
        });

        setLastSyncedAt(new Date());
        setError(null);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        setError(
          err instanceof Error
            ? `Backend: ${err.message}`
            : "Gagal memuat data pembayaran dari backend"
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

  useEffect(() => {
    void fetchPaymentData(false);

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        void fetchPaymentData(true);
      }, pollIntervalMs);

      return () => {
        clearInterval(interval);
        abortRef.current?.abort();
      };
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchPaymentData, pollIntervalMs]);

  const toggleStatus = useCallback((id: string) => {
    setPayments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextActive = !item.isActive;
          return {
            ...item,
            isActive: nextActive,
            status: nextActive ? "ACTIVE" : "INACTIVE",
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  const deletePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const deleteMultiple = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setPayments((prev) => prev.filter((p) => !idSet.has(p.id)));
  }, []);

  const createPayment = useCallback(
    async (
      data: Omit<
        PaymentMethodItem,
        "id" | "transactionCount" | "totalVolume" | "updatedAt"
      >
    ) => {
      try {
        const newItem: PaymentMethodItem = {
          ...data,
          id: `pm-${Date.now()}`,
          transactionCount: 0,
          totalVolume: 0,
          updatedAt: new Date().toISOString(),
        };
        setPayments((prev) => [newItem, ...prev]);
        toast.add({
          title: `Metode ${newItem.name} berhasil ditambahkan`,
        });
        return true;
      } catch {
        toast.add({
          title: "Gagal menambahkan metode pembayaran",
        });
        return false;
      }
    },
    []
  );

  const updatePayment = useCallback(
    async (
      id: string,
      data: Partial<Omit<PaymentMethodItem, "id" | "updatedAt">>
    ) => {
      try {
        setPayments((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
        toast.add({
          title: "Metode pembayaran berhasil diperbarui",
        });
        return true;
      } catch {
        toast.add({
          title: "Gagal memperbarui metode pembayaran",
        });
        return false;
      }
    },
    []
  );

  return {
    payments,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    refetch: fetchPaymentData,
    toggleStatus,
    deletePayment,
    deleteMultiple,
    createPayment,
    updatePayment,
  };
}
