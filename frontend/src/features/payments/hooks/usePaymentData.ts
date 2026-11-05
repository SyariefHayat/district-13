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

const CUSTOM_PAYMENTS_KEY = "district13_custom_payment_methods_v1";
const OVERRIDES_KEY = "district13_payment_overrides_v1";

function getStoredCustomPayments(): PaymentMethodItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredCustomPayments(items: PaymentMethodItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_PAYMENTS_KEY, JSON.stringify(items));
  } catch {}
}

function getStoredOverrides(): Record<string, Partial<PaymentMethodItem>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredOverrides(
  overrides: Record<string, Partial<PaymentMethodItem>>
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {}
}

export interface UsePaymentDataOptions {
  pollIntervalMs?: number;
}

export function usePaymentData(options?: UsePaymentDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 3000;
  const { authorizedFetch } = useAuth();

  const [payments, setPayments] = useState<PaymentMethodItem[]>(() => {
    const custom = getStoredCustomPayments();
    const overrides = getStoredOverrides();
    const base = DEFAULT_PAYMENT_METHODS.map((bm) => {
      const ovr = overrides[bm.id] || overrides[bm.code];
      return ovr ? { ...bm, ...ovr } : bm;
    });
    return [...base, ...custom];
  });
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

        const customItems = getStoredCustomPayments();
        const overrides = getStoredOverrides();

        setPayments((prev) => {
          // 1. Merge base methods with any live state and persistent overrides
          const mergedBase: PaymentMethodItem[] = baseMethods.map((bm) => {
            const persistentOvr = overrides[bm.id] || overrides[bm.code];
            const liveState = prev.find(
              (p) => p.id === bm.id || p.code === bm.code
            );

            return {
              ...bm,
              name: liveState?.name || persistentOvr?.name || bm.name,
              provider:
                liveState?.provider || persistentOvr?.provider || bm.provider,
              accountNumber:
                liveState?.accountNumber ??
                persistentOvr?.accountNumber ??
                bm.accountNumber,
              feePercentage:
                liveState?.feePercentage ??
                persistentOvr?.feePercentage ??
                bm.feePercentage,
              settlementTime:
                liveState?.settlementTime ||
                persistentOvr?.settlementTime ||
                bm.settlementTime,
              minAmount:
                liveState?.minAmount ??
                persistentOvr?.minAmount ??
                bm.minAmount,
              description:
                liveState?.description ??
                persistentOvr?.description ??
                bm.description,
              isActive:
                liveState?.isActive ?? persistentOvr?.isActive ?? bm.isActive,
              status: liveState?.status ?? persistentOvr?.status ?? bm.status,
            };
          });

          // 2. Include custom user-added payment methods
          const combined: PaymentMethodItem[] = [...mergedBase];
          for (const ci of customItems) {
            if (!combined.some((m) => m.id === ci.id || m.code === ci.code)) {
              combined.push(ci);
            }
          }

          // 3. Keep any in-memory additions that haven't persisted yet
          for (const p of prev) {
            if (!combined.some((m) => m.id === p.id || m.code === p.code)) {
              combined.push(p);
            }
          }

          return arePaymentListsEqual(prev, combined) ? prev : combined;
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
          const nextStatus = nextActive ? "ACTIVE" : "INACTIVE";

          const customList = getStoredCustomPayments();
          if (customList.some((c) => c.id === id)) {
            setStoredCustomPayments(
              customList.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      isActive: nextActive,
                      status: nextStatus,
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              )
            );
          } else {
            const overrides = getStoredOverrides();
            overrides[id] = {
              ...overrides[id],
              isActive: nextActive,
              status: nextStatus,
            };
            setStoredOverrides(overrides);
          }

          return {
            ...item,
            isActive: nextActive,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  const deletePayment = useCallback((id: string) => {
    const customList = getStoredCustomPayments();
    const updatedCustom = customList.filter((p) => p.id !== id);
    setStoredCustomPayments(updatedCustom);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const deleteMultiple = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    const customList = getStoredCustomPayments();
    const updatedCustom = customList.filter((p) => !idSet.has(p.id));
    setStoredCustomPayments(updatedCustom);
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
        const currentCustom = getStoredCustomPayments();
        const updatedCustom = [
          newItem,
          ...currentCustom.filter((c) => c.code !== newItem.code),
        ];
        setStoredCustomPayments(updatedCustom);
        setPayments((prev) => [
          newItem,
          ...prev.filter((p) => p.code !== newItem.code),
        ]);
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
        const currentCustom = getStoredCustomPayments();
        const isCustom = currentCustom.some((p) => p.id === id);
        if (isCustom) {
          const updatedCustom = currentCustom.map((p) =>
            p.id === id
              ? { ...p, ...data, updatedAt: new Date().toISOString() }
              : p
          );
          setStoredCustomPayments(updatedCustom);
        } else {
          const overrides = getStoredOverrides();
          overrides[id] = { ...overrides[id], ...data };
          setStoredOverrides(overrides);
        }

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
