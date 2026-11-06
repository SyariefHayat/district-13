import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import type {
  CashierProductStock,
  CashierSchedule,
  CashierShift,
  CashierShiftSummary,
  CashierTransaction,
} from "../data/cashierData";

export function useCashierDashboard() {
  const { authorizedFetch, user } = useAuth();

  const [currentShift, setCurrentShift] = useState<CashierShift | null>(null);
  const [shiftSummary, setShiftSummary] = useState<CashierShiftSummary | null>(
    null
  );
  const [transactions, setTransactions] = useState<CashierTransaction[]>([]);
  const [schedules, setSchedules] = useState<CashierSchedule[]>([]);
  const [products, setProducts] = useState<CashierProductStock[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent && isInitialMount.current) {
        setIsLoading(true);
      }
      setIsRefreshing(true);
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // 1. Fetch Current Shift
        let activeShift: CashierShift | null = null;
        try {
          const shiftRes = await authorizedFetch("/shifts/current", {
            signal: controller.signal,
          });
          if (shiftRes.ok) {
            const shiftData = await shiftRes.json();
            if (shiftData && shiftData.id) {
              activeShift = shiftData;
            }
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }

        setCurrentShift(activeShift);

        // 2. If active shift, fetch Shift Summary
        if (activeShift?.id) {
          try {
            const summaryRes = await authorizedFetch(
              `/shifts/${activeShift.id}/summary`,
              {
                signal: controller.signal,
              }
            );
            if (summaryRes.ok) {
              const summaryData =
                (await summaryRes.json()) as CashierShiftSummary;
              setShiftSummary(summaryData);
            }
          } catch {
            // non-fatal
          }
        } else {
          setShiftSummary(null);
        }

        // 3. Fetch Recent Transactions
        try {
          const txRes = await authorizedFetch("/transactions?limit=25", {
            signal: controller.signal,
          });
          if (txRes.ok) {
            const txJson = await txRes.json();
            const rawItems = Array.isArray(txJson.data)
              ? txJson.data
              : Array.isArray(txJson)
                ? txJson
                : [];

            const mapped: CashierTransaction[] = rawItems.map((item: any) => ({
              id: item.id,
              transactionNumber:
                item.transactionNumber || `TRX-${item.id.slice(0, 8)}`,
              shiftId: item.shiftId,
              userId: item.userId,
              subtotalAmount: Number(item.subtotalAmount || 0),
              discountAmount: Number(item.discountAmount || 0),
              taxAmount: Number(item.taxAmount || 0),
              totalAmount: Number(item.totalAmount || 0),
              paidAmount: Number(item.paidAmount || 0),
              changeAmount: Number(item.changeAmount || 0),
              paymentMethod: item.paymentMethod || "CASH",
              status: item.status || "COMPLETED",
              createdAt: item.createdAt,
              itemCount: Array.isArray(item.items)
                ? item.items.length
                : Number(item.itemCount || 1),
              cashierName: item.cashierName || user?.username || "Kasir",
            }));
            setTransactions(mapped);
          }
        } catch {
          // non-fatal
        }

        // 4. Fetch Schedules
        try {
          const schedRes = await authorizedFetch("/schedules?limit=10", {
            signal: controller.signal,
          });
          if (schedRes.ok) {
            const schedJson = await schedRes.json();
            const rawSched = Array.isArray(schedJson.data)
              ? schedJson.data
              : Array.isArray(schedJson)
                ? schedJson
                : [];
            const mappedSched: CashierSchedule[] = rawSched.map((s: any) => ({
              id: s.id,
              userId: s.userId,
              userName: s.userName,
              shiftType: s.shiftType || "MORNING",
              shiftName: s.shiftName || "Shift Pagi",
              date: s.date,
              startTime: s.startTime || "08:00",
              endTime: s.endTime || "16:00",
              status: s.status || "SCHEDULED",
              notes: s.notes,
            }));
            setSchedules(mappedSched);
          }
        } catch {
          // non-fatal
        }

        // 5. Fetch Products (for counter stock lookup)
        try {
          const prodRes = await authorizedFetch("/products?limit=50", {
            signal: controller.signal,
          });
          if (prodRes.ok) {
            const prodJson = await prodRes.json();
            const rawProd = Array.isArray(prodJson.data)
              ? prodJson.data
              : Array.isArray(prodJson)
                ? prodJson
                : [];
            const mappedProd: CashierProductStock[] = rawProd.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: Number(p.price || 0),
              categoryName: p.categoryName || "Umum",
              displayStock: Number(p.displayStock ?? p.stock ?? 0),
              isAvailable: Boolean(p.isAvailable),
              isActive: Boolean(p.isActive),
            }));
            setProducts(mappedProd);
          }
        } catch {
          // non-fatal
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Gagal memuat data kasir"
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isInitialMount.current = false;
      }
    },
    [authorizedFetch, user?.username]
  );

  useEffect(() => {
    void loadData();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadData]);

  // Actions
  const openShift = useCallback(
    async (openingCash: string) => {
      try {
        const normalized = openingCash.replace(/[^0-9.]/g, "");
        if (!normalized || parseFloat(normalized) < 0) {
          throw new Error("Nominal modal awal harus berupa angka valid");
        }
        const res = await authorizedFetch("/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openingCash: normalized }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const msg = body?.message || `Gagal membuka shift (${res.status})`;
          throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
        }

        toast.add({
          title: "Shift Berhasil Dibuka",
          description:
            "Shift kasir aktif. Anda dapat mulai melayani transaksi.",
        });
        await loadData(true);
        return true;
      } catch (err: any) {
        toast.add({
          title: "Gagal Membuka Shift",
          description: err.message || "Terjadi kesalahan saat membuka shift",
        });
        return false;
      }
    },
    [authorizedFetch, loadData]
  );

  const closeShift = useCallback(
    async (closingCash: string) => {
      if (!currentShift?.id) {
        toast.add({ title: "Tidak ada shift aktif untuk ditutup" });
        return false;
      }
      try {
        const normalized = closingCash.replace(/[^0-9.]/g, "");
        if (!normalized || parseFloat(normalized) < 0) {
          throw new Error("Nominal uang penutupan harus valid");
        }
        const res = await authorizedFetch(`/shifts/${currentShift.id}/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ closingCash: normalized }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const msg = body?.message || `Gagal menutup shift (${res.status})`;
          throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
        }

        toast.add({
          title: "Shift Selesai Ditutup",
          description: "Laporan penutupan shift telah tersimpan ke sistem.",
        });
        await loadData(true);
        return true;
      } catch (err: any) {
        toast.add({
          title: "Gagal Menutup Shift",
          description: err.message || "Terjadi kesalahan saat menutup shift",
        });
        return false;
      }
    },
    [authorizedFetch, currentShift?.id, loadData]
  );

  const createCashMovement = useCallback(
    async (type: "IN" | "OUT", amount: string, description?: string) => {
      if (!currentShift?.id) {
        toast.add({ title: "Harus membuka shift terlebih dahulu" });
        return false;
      }
      try {
        const normalized = amount.replace(/[^0-9.]/g, "");
        if (!normalized || parseFloat(normalized) <= 0) {
          throw new Error("Nominal kas masuk/keluar harus lebih dari 0");
        }
        const res = await authorizedFetch(
          `/shifts/${currentShift.id}/cash-movements`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              amount: normalized,
              description: description?.trim() || undefined,
            }),
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const msg =
            body?.message || `Gagal mencatat mutasi kas (${res.status})`;
          throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
        }

        toast.add({
          title: `Kas ${type === "IN" ? "Masuk" : "Keluar"} Berhasil Dicatat`,
          description: `Nominal Rp ${Number(normalized).toLocaleString("id-ID")} telah diperbarui di laci.`,
        });
        await loadData(true);
        return true;
      } catch (err: any) {
        toast.add({
          title: "Gagal Mencatat Mutasi Kas",
          description: err.message || "Terjadi kesalahan",
        });
        return false;
      }
    },
    [authorizedFetch, currentShift?.id, loadData]
  );

  // Derived shift performance calculations
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todaySchedule =
    schedules.find((s) => s.date === todayStr) || schedules[0] || null;

  // Filter transactions for current shift or today
  const shiftTransactions = currentShift
    ? transactions.filter((t) => t.shiftId === currentShift.id)
    : transactions.filter((t) => t.createdAt.startsWith(todayStr));

  const completedTransactions = shiftTransactions.filter(
    (t) => t.status === "COMPLETED"
  );

  const totalSalesFromTx = completedTransactions.reduce(
    (acc, t) => acc + t.totalAmount,
    0
  );
  const cashSalesFromTx = completedTransactions
    .filter((t) => t.paymentMethod === "CASH")
    .reduce((acc, t) => acc + t.totalAmount, 0);
  const nonCashSalesFromTx = totalSalesFromTx - cashSalesFromTx;

  // Drawer cash calculation
  const openingCashNum = Number(
    shiftSummary?.openingCash ?? currentShift?.openingCash ?? 0
  );
  const cashSalesNum = Number(shiftSummary?.cashSales ?? cashSalesFromTx);
  const cashInNum = Number(shiftSummary?.cashIn ?? 0);
  const cashOutNum = Number(shiftSummary?.cashOut ?? 0);

  const calculatedDrawerCash = Number(
    shiftSummary?.expectedCash ??
      openingCashNum + cashSalesNum + cashInNum - cashOutNum
  );

  const avgTransactionAmount =
    completedTransactions.length > 0
      ? Math.round(totalSalesFromTx / completedTransactions.length)
      : 0;

  return {
    currentShift,
    shiftSummary,
    transactions: shiftTransactions,
    allRecentTransactions: transactions,
    schedules,
    todaySchedule,
    products,
    isLoading,
    isRefreshing,
    error,
    metrics: {
      openingCash: openingCashNum,
      cashSales: cashSalesNum,
      nonCashSales: nonCashSalesFromTx,
      totalSales: totalSalesFromTx,
      cashIn: cashInNum,
      cashOut: cashOutNum,
      drawerCash: calculatedDrawerCash,
      transactionCount: completedTransactions.length,
      avgTransaction: avgTransactionAmount,
    },
    refetch: () => loadData(true),
    openShift,
    closeShift,
    createCashMovement,
  };
}
