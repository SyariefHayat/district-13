import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import {
  INITIAL_PAYMENT_METHODS,
  type PaymentMethodItem,
} from "../data/paymentData";

export function usePaymentData() {
  const [payments, setPayments] = useState<PaymentMethodItem[]>(() => {
    const saved = localStorage.getItem("district13_payment_methods_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to initial
      }
    }
    return INITIAL_PAYMENT_METHODS;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(
      "district13_payment_methods_v2",
      JSON.stringify(payments)
    );
  }, [payments]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 350));
      const saved = localStorage.getItem("district13_payment_methods_v2");
      if (saved) {
        setPayments(JSON.parse(saved));
      } else {
        setPayments(INITIAL_PAYMENT_METHODS);
      }
    } catch {
      setError("Gagal memuat data metode pembayaran.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    error,
    refetch: loadData,
    toggleStatus,
    deletePayment,
    deleteMultiple,
    createPayment,
    updatePayment,
  };
}
