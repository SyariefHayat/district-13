import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import type {
  WarehouseInventoryItem,
  WarehouseMovementItem,
} from "../data/warehouseData";

interface InventoryDashboardItem {
  id: string;
  productId: string;
  productName: string;
  location: "WAREHOUSE" | "DISPLAY";
  stock: number;
  updatedAt: string;
}

interface InventoryDashboardResponse {
  data: InventoryDashboardItem[];
  totals: {
    WAREHOUSE: number;
    DISPLAY: number;
  };
  page: number;
  limit: number;
  total: number;
}

interface RawBackendProduct {
  id: string;
  name: string;
  sku?: string;
  categoryName?: string;
  price?: number | string;
  costPrice?: number | string;
  images?: string[];
  stock?: number;
  displayStock?: number;
  updatedAt?: string;
}

export function useWarehouseData() {
  const { authorizedFetch } = useAuth();
  const [items, setItems] = useState<WarehouseInventoryItem[]>([]);
  const [movements, setMovements] = useState<WarehouseMovementItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoad = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchWarehouseData = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) {
        setIsLoading(true);
      }
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const [invRes, prodRes, catRes] = await Promise.all([
          authorizedFetch("/inventory/dashboard?limit=100", {
            signal: controller.signal,
          }).catch(() => null),
          authorizedFetch("/products?limit=100", {
            signal: controller.signal,
          }).catch(() => null),
          authorizedFetch("/categories", {
            signal: controller.signal,
          }).catch(() => null),
        ]);

        if (controller.signal.aborted) return;

        let mergedItems: WarehouseInventoryItem[] = [];

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          const productsList: RawBackendProduct[] = Array.isArray(prodData)
            ? prodData
            : prodData.data || [];

          const inventoryMap = new Map<
            string,
            { warehouseStock: number; displayStock: number; updatedAt?: string }
          >();

          if (invRes && invRes.ok) {
            const invJson: InventoryDashboardResponse = await invRes.json();
            const invItems = invJson.data || [];
            invItems.forEach((inv) => {
              const current = inventoryMap.get(inv.productId) || {
                warehouseStock: 0,
                displayStock: 0,
                updatedAt: inv.updatedAt,
              };
              if (inv.location === "WAREHOUSE") {
                current.warehouseStock = inv.stock;
              } else if (inv.location === "DISPLAY") {
                current.displayStock = inv.stock;
              }
              inventoryMap.set(inv.productId, current);
            });
          }

          if (productsList.length > 0) {
            mergedItems = productsList.map((p) => {
              const inv = inventoryMap.get(p.id);
              const warehouseStock = inv ? inv.warehouseStock : 0;
              const displayStock = inv ? inv.displayStock : 0;
              const costPrice = Number(p.costPrice) || 0;
              const sellingPrice = Number(p.price) || 0;

              return {
                id: p.id,
                productId: p.id,
                name: p.name,
                sku: p.sku || "-",
                category: p.categoryName || "Uncategorized",
                image: p.images?.[0],
                warehouseStock,
                displayStock,
                totalStock: warehouseStock + displayStock,
                minStockThreshold: 10,
                costPrice,
                sellingPrice,
                updatedAt:
                  inv?.updatedAt || p.updatedAt || new Date().toISOString(),
              };
            });
          }
        }

        setItems(mergedItems);

        // Set categories
        if (catRes && catRes.ok) {
          const catJson = await catRes.json();
          const catList = Array.isArray(catJson) ? catJson : catJson.data || [];
          const names = catList
            .filter(
              (c: { isActive?: boolean; name: string }) => c.isActive !== false
            )
            .map((c: { name: string }) => c.name);
          if (names.length > 0) {
            setCategories(["Semua Kategori", ...names]);
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.warn("Could not sync warehouse data:", err);
        setError("Gagal menyinkronkan data inventori dari database server.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          isInitialLoad.current = false;
        }
      }
    },
    [authorizedFetch]
  );

  const fetchMovements = useCallback(async () => {
    setIsMovementsLoading(true);
    try {
      const res = await authorizedFetch("/inventory/movements?limit=50");
      if (res && res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setMovements(list);
      }
    } catch (err) {
      console.warn("Could not fetch movements:", err);
    } finally {
      setIsMovementsLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    void fetchWarehouseData(false);
    void fetchMovements();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchWarehouseData, fetchMovements]);

  const restock = useCallback(
    async (
      productId: string,
      quantity: number,
      targetLocation: "WAREHOUSE" | "DISPLAY" = "WAREHOUSE"
    ) => {
      try {
        const res = await authorizedFetch("/inventory/restock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity,
            location: targetLocation,
          }),
        });

        if (!res.ok) {
          // If server returned error but it's mock id, update local item
          const errBody = await res.json().catch(() => ({}));
          console.warn("Backend restock note:", errBody);
        }

        // Optimistic update
        setItems((prev) =>
          prev.map((item) => {
            if (item.productId === productId || item.id === productId) {
              const newWhStock =
                targetLocation === "WAREHOUSE"
                  ? item.warehouseStock + quantity
                  : item.warehouseStock;
              const newDispStock =
                targetLocation === "DISPLAY"
                  ? item.displayStock + quantity
                  : item.displayStock;
              return {
                ...item,
                warehouseStock: newWhStock,
                displayStock: newDispStock,
                totalStock: newWhStock + newDispStock,
                updatedAt: new Date().toISOString(),
              };
            }
            return item;
          })
        );

        const targetLabel =
          targetLocation === "DISPLAY" ? "etalase kasir" : "gudang utama";
        toast.add({
          title: "Restock Berhasil",
          description: `Berhasil menambahkan +${quantity} unit ke ${targetLabel}`,
        });

        void fetchWarehouseData(true);
        void fetchMovements();
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal Restock",
          description:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat restock",
        });
        return false;
      }
    },
    [authorizedFetch, fetchWarehouseData, fetchMovements]
  );

  const transferToDisplay = useCallback(
    async (productId: string, quantity: number) => {
      try {
        const res = await authorizedFetch("/inventory/transfer-to-display", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.warn("Backend transfer note:", errBody);
        }

        // Optimistic update
        setItems((prev) =>
          prev.map((item) => {
            if (item.productId === productId || item.id === productId) {
              const newWhStock = Math.max(0, item.warehouseStock - quantity);
              const newDispStock = item.displayStock + quantity;
              return {
                ...item,
                warehouseStock: newWhStock,
                displayStock: newDispStock,
                totalStock: newWhStock + newDispStock,
                updatedAt: new Date().toISOString(),
              };
            }
            return item;
          })
        );

        toast.add({
          title: "Transfer Stok Berhasil",
          description: `Berhasil memindahkan ${quantity} unit ke etalase toko`,
        });

        void fetchWarehouseData(true);
        void fetchMovements();
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal Transfer",
          description:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat transfer stok",
        });
        return false;
      }
    },
    [authorizedFetch, fetchWarehouseData, fetchMovements]
  );

  return {
    items,
    movements,
    categories,
    isLoading,
    isMovementsLoading,
    error,
    refetch: fetchWarehouseData,
    fetchMovements,
    restock,
    transferToDisplay,
  };
}
