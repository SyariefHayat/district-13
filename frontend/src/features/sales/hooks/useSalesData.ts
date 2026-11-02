import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/toast";
import {
  type PaymentMethod,
  type SaleTransaction,
  type TransactionStatus,
  type SalesStats,
  INITIAL_MOCK_TRANSACTIONS,
} from "../data/salesData";

export interface UseSalesDataOptions {
  initialLimit?: number;
}

export function useSalesData(_options?: UseSalesDataOptions) {
  const [transactions, setTransactions] = useState<SaleTransaction[]>(
    INITIAL_MOCK_TRANSACTIONS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TransactionStatus>(
    "ALL"
  );
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    "ALL" | PaymentMethod
  >("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    // Simulating quick instant initialization
    setIsLoading(false);
  }, []);

  // Single transaction detail fetcher
  const getTransactionDetail = useCallback(
    async (id: string): Promise<SaleTransaction | null> => {
      const found = transactions.find((t) => t.id === id);
      return found || null;
    },
    [transactions]
  );

  // Void a transaction locally
  const voidTransaction = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
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

      toast.add({
        title: "Transaksi Berhasil Dibatalkan (Void)",
        description: `Status transaksi telah diubah menjadi Dibatalkan.`,
      });

      return true;
    },
    []
  );

  // Compute stats
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

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPaymentMethodFilter("ALL");
    setStartDate("");
    setEndDate("");
  }, []);

  return {
    transactions,
    isLoading,
    error,
    stats,
    searchQuery,
    statusFilter,
    paymentMethodFilter,
    startDate,
    endDate,
    setSearchQuery,
    setStatusFilter,
    setPaymentMethodFilter,
    setStartDate,
    setEndDate,
    resetFilters,
    getTransactionDetail,
    voidTransaction,
  };
}
