import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import type { WarehouseInventoryItem } from "@/features/warehouse/data/warehouseData";
import type {
  AdminActiveShift,
  AdminLowStockItem,
  AdminMetrics,
  AdminStaffSchedule,
  AdminTransaction,
  HourlyTrafficData,
} from "../data/adminData";

export function useAdminDashboard() {
  const { authorizedFetch, user } = useAuth();

  const [metrics, setMetrics] = useState<AdminMetrics>({
    todaySales: 0,
    todayTransactions: 0,
    cashSales: 0,
    qrisSales: 0,
    activeShiftsCount: 0,
    lowStockCount: 0,
    cashIn: 0,
    cashOut: 0,
    voidCount: 0,
    voidValue: 0,
  });

  const [activeShifts, setActiveShifts] = useState<AdminActiveShift[]>([]);
  const [lowStockItems, setLowStockItems] = useState<AdminLowStockItem[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<
    WarehouseInventoryItem[]
  >([]);
  const [recentTransactions, setRecentTransactions] = useState<
    AdminTransaction[]
  >([]);
  const [todaySchedules, setTodaySchedules] = useState<AdminStaffSchedule[]>(
    []
  );
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTrafficData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  const todayStr = format(new Date(), "yyyy-MM-dd");

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
        // Fetch Users first (for cashier name lookup)
        const userMap = new Map<string, string>();
        try {
          const userRes = await authorizedFetch("/users?limit=50", {
            signal: controller.signal,
          });
          if (userRes.ok) {
            const userJson = await userRes.json();
            const uList = Array.isArray(userJson.data)
              ? userJson.data
              : Array.isArray(userJson)
                ? userJson
                : [];
            uList.forEach((u: any) => {
              userMap.set(u.id, u.fullName || u.username || "Karyawan");
            });
          }
        } catch {
          // non-fatal
        }

        // 1. Fetch Today's Overview (Sales, Hourly Heatmap)
        let todaySales = 0;
        let todayTxCount = 0;
        let trafficMap: HourlyTrafficData[] = [];
        try {
          const overviewRes = await authorizedFetch(
            `/reports/overview?startDate=${todayStr}&endDate=${todayStr}`,
            { signal: controller.signal }
          );
          if (overviewRes.ok) {
            const ovJson = await overviewRes.json();
            todaySales = Number(ovJson.kpis?.sales?.value || 0);
            todayTxCount = Number(ovJson.kpis?.transactions?.value || 0);

            if (Array.isArray(ovJson.hourlyHeatmap)) {
              // Group by hour
              const byHour = new Map<
                number,
                { count: number; sales: number }
              >();
              ovJson.hourlyHeatmap.forEach((h: any) => {
                const hourNum = Number(h.hour ?? 0);
                const prev = byHour.get(hourNum) ?? { count: 0, sales: 0 };
                byHour.set(hourNum, {
                  count: prev.count + Number(h.transactionCount || 0),
                  sales: prev.sales + Number(h.totalSales || 0),
                });
              });
              trafficMap = Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                transactionCount: byHour.get(i)?.count ?? 0,
                totalSales: byHour.get(i)?.sales ?? 0,
              }));
            }
          }
        } catch {
          // non-fatal
        }

        // 2. Fetch Cash Reports (Cash vs QRIS sales, Cash In/Out, Voids)
        let cashSales = 0;
        let qrisSales = 0;
        let voidCount = 0;
        let voidValue = 0;
        let cashIn = 0;
        let cashOut = 0;
        try {
          const cashRes = await authorizedFetch(
            `/reports/cash?startDate=${todayStr}&endDate=${todayStr}`,
            { signal: controller.signal }
          );
          if (cashRes.ok) {
            const cashJson = await cashRes.json();
            cashSales = Number(cashJson.summary?.cashSales || 0);
            qrisSales = Number(cashJson.summary?.qrisSales || 0);
            voidCount = Number(cashJson.summary?.voidCount || 0);
            voidValue = Number(cashJson.summary?.voidValue || 0);
            cashIn = Number(cashJson.moves?.cashIn || 0);
            cashOut = Number(cashJson.moves?.cashOut || 0);
          }
        } catch {
          // non-fatal
        }

        // 3. Fetch Active Shifts (status=OPEN)
        const mappedShifts: AdminActiveShift[] = [];
        try {
          const shiftsRes = await authorizedFetch(
            "/shifts?status=OPEN&limit=20",
            {
              signal: controller.signal,
            }
          );
          if (shiftsRes.ok) {
            const shiftsJson = await shiftsRes.json();
            const rawShifts = Array.isArray(shiftsJson.data)
              ? shiftsJson.data
              : Array.isArray(shiftsJson)
                ? shiftsJson
                : [];

            // For each shift, fetch shift summary
            for (const s of rawShifts) {
              let shiftExpected = Number(s.openingCash || 0);
              let sCashSales = 0;
              let sCashIn = 0;
              let sCashOut = 0;
              let sTxCount = 0;

              try {
                const sSumRes = await authorizedFetch(
                  `/shifts/${s.id}/summary`,
                  { signal: controller.signal }
                );
                if (sSumRes.ok) {
                  const sSum = await sSumRes.json();
                  shiftExpected = Number(sSum.expectedCash || shiftExpected);
                  sCashSales = Number(sSum.cashSales || 0);
                  sCashIn = Number(sSum.cashIn || 0);
                  sCashOut = Number(sSum.cashOut || 0);
                  sTxCount = Number(sSum.transactionCount || 0);
                }
              } catch {
                // non-fatal
              }

              mappedShifts.push({
                id: s.id,
                userId: s.userId,
                cashierName:
                  userMap.get(s.userId) || s.cashierName || "Kasir On-Duty",
                openedAt: s.openedAt,
                openingCash: Number(s.openingCash || 0),
                expectedCash: shiftExpected,
                cashSales: sCashSales,
                cashIn: sCashIn,
                cashOut: sCashOut,
                transactionCount: sTxCount,
              });
            }
          }
        } catch {
          // non-fatal
        }
        setActiveShifts(mappedShifts);

        // 4. Fetch Inventory Items & Check Low Stock
        const lowItems: AdminLowStockItem[] = [];
        const whItems: WarehouseInventoryItem[] = [];
        try {
          const invRes = await authorizedFetch(
            "/inventory/dashboard?limit=100",
            {
              signal: controller.signal,
            }
          );
          if (invRes.ok) {
            const invJson = await invRes.json();
            const rawItems = Array.isArray(invJson.data)
              ? invJson.data
              : Array.isArray(invJson.items)
                ? invJson.items
                : Array.isArray(invJson)
                  ? invJson
                  : [];

            // Aggregate items by productId because inventories have location WAREHOUSE and DISPLAY
            const productStockMap = new Map<
              string,
              {
                id: string;
                productId: string;
                name: string;
                category: string;
                displayStock: number;
                warehouseStock: number;
                minStockThreshold: number;
                updatedAt: string;
              }
            >();

            rawItems.forEach((inv: any) => {
              const pId = inv.productId || inv.id;
              const pName = inv.productName || inv.name || "Produk";
              const cat = inv.categoryName || inv.category || "Umum";
              const existing = productStockMap.get(pId) || {
                id: inv.id || pId,
                productId: pId,
                name: pName,
                category: cat,
                displayStock: 0,
                warehouseStock: 0,
                minStockThreshold: 5,
                updatedAt: inv.updatedAt || new Date().toISOString(),
              };

              const loc = String(inv.location || "").toUpperCase();
              const stock = Number(inv.stock || 0);
              if (loc === "DISPLAY") {
                existing.displayStock = stock;
              } else if (loc === "WAREHOUSE") {
                existing.warehouseStock = stock;
              } else {
                // If single record with displayStock & warehouseStock
                if (inv.displayStock !== undefined)
                  existing.displayStock = Number(inv.displayStock);
                if (inv.warehouseStock !== undefined)
                  existing.warehouseStock = Number(inv.warehouseStock);
              }
              productStockMap.set(pId, existing);
            });

            productStockMap.forEach((item) => {
              let status:
                "out_of_stock" | "needs_display_transfer" | "low_stock" =
                "low_stock";
              if (item.displayStock === 0 && item.warehouseStock === 0) {
                status = "out_of_stock";
              } else if (item.displayStock <= 3 && item.warehouseStock > 0) {
                status = "needs_display_transfer";
              }

              // Highlight if display stock <= 5 or warehouse stock <= 5
              if (item.displayStock <= 5 || item.warehouseStock <= 3) {
                lowItems.push({
                  id: item.id,
                  productId: item.productId,
                  name: item.name,
                  category: item.category,
                  displayStock: item.displayStock,
                  warehouseStock: item.warehouseStock,
                  minStockThreshold: item.minStockThreshold,
                  status,
                });
              }

              whItems.push({
                id: item.id,
                productId: item.productId,
                name: item.name,
                sku: "",
                category: item.category,
                warehouseStock: item.warehouseStock,
                displayStock: item.displayStock,
                totalStock: item.displayStock + item.warehouseStock,
                minStockThreshold: item.minStockThreshold,
                costPrice: 0,
                sellingPrice: 0,
                updatedAt: item.updatedAt,
              });
            });
          }
        } catch {
          // non-fatal
        }
        setLowStockItems(lowItems);
        setWarehouseItems(whItems);

        // 5. Fetch Recent Transactions
        try {
          const txRes = await authorizedFetch("/transactions?limit=25", {
            signal: controller.signal,
          });
          if (txRes.ok) {
            const txJson = await txRes.json();
            const rawTx = Array.isArray(txJson.data)
              ? txJson.data
              : Array.isArray(txJson)
                ? txJson
                : [];
            const mappedTx: AdminTransaction[] = rawTx.map((t: any) => ({
              id: t.id,
              transactionNumber:
                t.transactionNumber || `TRX-${t.id.slice(0, 8).toUpperCase()}`,
              shiftId: t.shiftId,
              userId: t.userId,
              cashierName: userMap.get(t.userId) || t.cashierName || "Kasir",
              subtotalAmount: Number(t.subtotalAmount || 0),
              discountAmount: Number(t.discountAmount || 0),
              taxAmount: Number(t.taxAmount || 0),
              totalAmount: Number(t.totalAmount || 0),
              paidAmount: Number(t.paidAmount || 0),
              changeAmount: Number(t.changeAmount || 0),
              paymentMethod: t.paymentMethod || "CASH",
              status: t.status || "COMPLETED",
              createdAt: t.createdAt,
              itemCount: Array.isArray(t.items)
                ? t.items.length
                : Number(t.itemCount || 1),
            }));
            setRecentTransactions(mappedTx);
          }
        } catch {
          // non-fatal
        }

        // 6. Fetch Today's Staff Schedules
        try {
          const schedRes = await authorizedFetch(
            `/schedules?startDate=${todayStr}&endDate=${todayStr}&limit=20`,
            { signal: controller.signal }
          );
          if (schedRes.ok) {
            const schedJson = await schedRes.json();
            const rawSched = Array.isArray(schedJson.data)
              ? schedJson.data
              : Array.isArray(schedJson)
                ? schedJson
                : [];
            const mappedSched: AdminStaffSchedule[] = rawSched.map(
              (s: any) => ({
                id: s.id,
                userId: s.userId,
                userName: userMap.get(s.userId) || s.userName || "Karyawan",
                shiftType: s.shiftType || "MORNING",
                shiftName: s.shiftName || "Shift Pagi",
                date: s.date,
                startTime: s.startTime || "08:00",
                endTime: s.endTime || "16:00",
                status: s.status || "SCHEDULED",
                notes: s.notes,
              })
            );
            setTodaySchedules(mappedSched);
          }
        } catch {
          // non-fatal
        }

        // Assemble Final Metrics
        setMetrics({
          todaySales,
          todayTransactions: todayTxCount,
          cashSales,
          qrisSales,
          activeShiftsCount: mappedShifts.length,
          lowStockCount: lowItems.length,
          cashIn,
          cashOut,
          voidCount,
          voidValue,
        });
        setHourlyTraffic(trafficMap);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat data dashboard admin"
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isInitialMount.current = false;
      }
    },
    [authorizedFetch, todayStr]
  );

  useEffect(() => {
    void loadData();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadData]);

  // Actions

  // 1. Record Cash Movement (Admin can record on any active shift)
  const createCashMovement = useCallback(
    async (
      shiftId: string,
      type: "IN" | "OUT",
      amount: number,
      description?: string
    ): Promise<boolean> => {
      try {
        const res = await authorizedFetch(`/shifts/${shiftId}/cash-movements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            amount: Number(amount),
            description: description?.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : "Gagal mencatat kas operasional"
          );
        }

        toast.add({
          title: `Kas ${type === "IN" ? "Masuk" : "Keluar"} berhasil dicatat!`,
        });
        void loadData(true);
        return true;
      } catch (err) {
        toast.add({
          title:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mencatat kas",
        });
        return false;
      }
    },
    [authorizedFetch, loadData]
  );

  // 2. Force Close Shift (Admin has shiftsCloseAny permission)
  const forceCloseShift = useCallback(
    async (
      shiftId: string,
      closingCash: number,
      notes?: string
    ): Promise<boolean> => {
      try {
        const res = await authorizedFetch(`/shifts/${shiftId}/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            closingCash: Number(closingCash),
            notes: notes?.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : "Gagal menutup shift kasir"
          );
        }

        toast.add({ title: "Shift kasir berhasil ditutup!" });
        void loadData(true);
        return true;
      } catch (err) {
        toast.add({
          title:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat menutup shift",
        });
        return false;
      }
    },
    [authorizedFetch, loadData]
  );

  // 3. Quick Transfer Warehouse to Display
  const transferToDisplay = useCallback(
    async (
      productId: string,
      quantity: number,
      notes?: string
    ): Promise<boolean> => {
      try {
        const res = await authorizedFetch("/inventory/transfer-to-display", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity: Number(quantity),
            notes: notes?.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : "Gagal melakukan transfer ke etalase"
          );
        }

        toast.add({ title: "Stok berhasil ditransfer ke etalase display!" });
        void loadData(true);
        return true;
      } catch (err) {
        toast.add({
          title:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat transfer stok",
        });
        return false;
      }
    },
    [authorizedFetch, loadData]
  );

  // 4. Void Transaction (Admin has transactionsVoid permission)
  const voidTransaction = useCallback(
    async (transactionId: string, reason: string): Promise<boolean> => {
      try {
        const res = await authorizedFetch(
          `/transactions/${transactionId}/void`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: reason.trim(),
            }),
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : "Gagal membatalkan transaksi"
          );
        }

        toast.add({ title: "Transaksi berhasil dibatalkan (VOID)!" });
        void loadData(true);
        return true;
      } catch (err) {
        toast.add({
          title:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat void transaksi",
        });
        return false;
      }
    },
    [authorizedFetch, loadData]
  );

  return {
    metrics,
    activeShifts,
    lowStockItems,
    warehouseItems,
    recentTransactions,
    todaySchedules,
    hourlyTraffic,
    isLoading,
    isRefreshing,
    error,
    refetch: () => loadData(false),
    createCashMovement,
    forceCloseShift,
    transferToDisplay,
    voidTransaction,
    currentAdminUser: user,
  };
}
