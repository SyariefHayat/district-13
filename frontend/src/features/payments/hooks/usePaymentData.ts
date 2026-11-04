import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import {
  INITIAL_PAYMENT_METHODS,
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

  const [payments, setPayments] = useState<PaymentMethodItem[]>(() => {
    const saved = localStorage.getItem("district13_payment_methods_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_PAYMENT_METHODS;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Sync to local storage for customized configurations (names, fees, accounts, status)
  useEffect(() => {
    localStorage.setItem(
      "district13_payment_methods_v2",
      JSON.stringify(payments)
    );
  }, [payments]);

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
        let fetchedSuccessfully = false;

        // 1. Try querying /reports/sales for aggregate database totals by payment method
        try {
          const reportRes = await authorizedFetch("/reports/sales", {
            signal: controller.signal,
          });

          if (reportRes.ok) {
            const reportData: BackendSalesReport = await reportRes.json();
            if (Array.isArray(reportData.byPaymentMethod)) {
              for (const bpm of reportData.byPaymentMethod) {
                const vol = Number(bpm.net) || Number(bpm.gross) || 0;
                const cnt = Number(bpm.count) || 0;
                methodStats.set(bpm.paymentMethod.toUpperCase(), {
                  volume: vol,
                  count: cnt,
                });
              }
              fetchedSuccessfully = true;
            }
          }
        } catch {
          // If reports endpoint is unavailable, we proceed to transactions fallback
        }

        // 2. Query /transactions?limit=100 for live recent transactions
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

            // If /reports/sales didn't give us aggregations, compute from live transactions
            if (!fetchedSuccessfully) {
              for (const tx of txList) {
                if (tx.status === "COMPLETED") {
                  const m = (tx.paymentMethod || "CASH").toUpperCase();
                  const prev = methodStats.get(m) || { volume: 0, count: 0 };
                  prev.volume += Number(tx.totalAmount) || 0;
                  prev.count += 1;
                  methodStats.set(m, prev);
                }
              }
              fetchedSuccessfully = true;
            }
          }
        } catch {
          // Handled below
        }

        if (controller.signal.aborted) return;

        if (fetchedSuccessfully) {
          setPayments((current) => {
            const updated = current.map((item) => {
              const codeUpper = item.code.toUpperCase();
              const typeUpper = item.type.toUpperCase();

              // Match against backend payment methods (CASH, QRIS, etc.)
              let stats = methodStats.get(codeUpper);
              if (
                !stats &&
                (typeUpper === "CASH" || codeUpper.includes("CASH"))
              ) {
                stats = methodStats.get("CASH");
              } else if (
                !stats &&
                (typeUpper === "QRIS" || codeUpper.includes("QRIS"))
              ) {
                stats = methodStats.get("QRIS");
              }

              if (stats) {
                return {
                  ...item,
                  totalVolume: stats.volume,
                  transactionCount: stats.count,
                  updatedAt: new Date().toISOString(),
                };
              }

              return item;
            });

            return arePaymentListsEqual(current, updated) ? current : updated;
          });

          setLastSyncedAt(new Date());
          setError(null);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        setError(
          err instanceof Error
            ? `Backend: ${err.message}`
            : "Gagal menyinkronkan data pembayaran realtime"
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
