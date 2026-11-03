import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import {
  INITIAL_DISCOUNTS,
  type CreateDiscountInput,
  type DiscountItem,
  type UpdateDiscountInput,
} from "../data/discountData";

export interface BackendDiscount {
  id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed";
  applyMode?: "automatic" | "manual";
  value: string | number;
  minPurchase?: string | number | null;
  maxDiscount?: string | number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  usageCount?: string | number | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function mapBackendDiscount(d: BackendDiscount): DiscountItem {
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    type: d.type === "fixed" ? "fixed" : "percentage",
    applyMode: d.applyMode === "manual" ? "manual" : "automatic",
    value: Number(d.value) || 0,
    minPurchase: Number(d.minPurchase) || 0,
    maxDiscount: d.maxDiscount != null ? Number(d.maxDiscount) : null,
    startDate: d.startDate ?? null,
    endDate: d.endDate ?? null,
    isActive: Boolean(d.isActive),
    usageCount: Number(d.usageCount) || 0,
    description: d.description ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export interface UseDiscountDataOptions {
  pollIntervalMs?: number;
}

function areDiscountListsEqual(a: DiscountItem[], b: DiscountItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const d1 = a[i];
    const d2 = b[i];
    if (
      d1.id !== d2.id ||
      d1.name !== d2.name ||
      d1.code !== d2.code ||
      d1.type !== d2.type ||
      d1.applyMode !== d2.applyMode ||
      d1.value !== d2.value ||
      d1.minPurchase !== d2.minPurchase ||
      d1.maxDiscount !== d2.maxDiscount ||
      d1.startDate !== d2.startDate ||
      d1.endDate !== d2.endDate ||
      d1.isActive !== d2.isActive ||
      d1.usageCount !== d2.usageCount ||
      d1.description !== d2.description
    ) {
      return false;
    }
  }
  return true;
}

export function useDiscountData(options?: UseDiscountDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 3000;
  const { authorizedFetch } = useAuth();
  const [discounts, setDiscounts] = useState<DiscountItem[]>(() => {
    const saved = localStorage.getItem("district13_discounts_warkop");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_DISCOUNTS;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);

  // Sync to local storage for offline resilience
  useEffect(() => {
    try {
      localStorage.setItem(
        "district13_discounts_warkop",
        JSON.stringify(discounts)
      );
    } catch {
      // ignore
    }
  }, [discounts]);

  const fetchDiscounts = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) {
        setIsLoading(true);
      }
      setIsSyncing(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await authorizedFetch("/discounts", {
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const list: BackendDiscount[] = Array.isArray(data)
            ? data
            : data.data || [];

          if (!controller.signal.aborted) {
            const mapped = list.map(mapBackendDiscount);
            setDiscounts((prev) =>
              areDiscountListsEqual(prev, mapped) ? prev : mapped
            );
            setLastSyncedAt(new Date());
            setError(null);
          }
        } else {
          const body = await res.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal memuat diskon dari server (${res.status})`;
          throw new Error(
            Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Keep fallback data if offline/error, but inform user
        setError(
          err instanceof Error
            ? err.message
            : "Gagal terhubung ke server backend"
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsSyncing(false);
          isInitialLoad.current = false;
        }
      }
    },
    [authorizedFetch]
  );

  useEffect(() => {
    void fetchDiscounts(false);

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        void fetchDiscounts(true);
      }, pollIntervalMs);

      const handleFocus = () => void fetchDiscounts(true);
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          void fetchDiscounts(true);
        }
      };

      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        abortRef.current?.abort();
      };
    }
  }, [fetchDiscounts, pollIntervalMs]);

  const createDiscount = useCallback(
    async (input: CreateDiscountInput): Promise<boolean> => {
      try {
        const res = await authorizedFetch("/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (res.ok) {
          const created = await res.json();
          const mapped = mapBackendDiscount(created);
          setDiscounts((prev) => [mapped, ...prev]);
          toast.add({ title: `Diskon "${input.name}" berhasil ditambahkan` });
          void fetchDiscounts(true);
          return true;
        }
      } catch {
        // Fallback local update
      }

      // Local state fallback
      const newDiscount: DiscountItem = {
        ...input,
        id: `disc-${Date.now()}`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDiscounts((prev) => [newDiscount, ...prev]);
      toast.add({ title: `Diskon "${input.name}" berhasil ditambahkan` });
      return true;
    },
    [authorizedFetch, fetchDiscounts]
  );

  const updateDiscount = useCallback(
    async (id: string, input: UpdateDiscountInput): Promise<boolean> => {
      try {
        const res = await authorizedFetch(`/discounts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (res.ok) {
          const updated = await res.json();
          const mapped = mapBackendDiscount(updated);
          setDiscounts((prev) =>
            prev.map((item) => (item.id === id ? mapped : item))
          );
          toast.add({ title: "Perubahan diskon berhasil disimpan" });
          void fetchDiscounts(true);
          return true;
        }
      } catch {
        // Fallback local update
      }

      setDiscounts((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...input,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      toast.add({ title: "Perubahan diskon berhasil disimpan" });
      return true;
    },
    [authorizedFetch, fetchDiscounts]
  );

  const toggleStatus = useCallback(
    async (id: string): Promise<boolean> => {
      const target = discounts.find((d) => d.id === id);
      if (!target) return false;

      const nextStatus = !target.isActive;

      // Optimistic update
      setDiscounts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isActive: nextStatus } : d))
      );

      try {
        const res = await authorizedFetch(`/discounts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: nextStatus }),
        });

        if (res.ok) {
          toast.add({
            title: nextStatus
              ? `Diskon "${target.name}" diaktifkan`
              : `Diskon "${target.name}" dinonaktifkan`,
          });
          void fetchDiscounts(true);
          return true;
        }
      } catch {
        // Ignore, local state updated
      }

      toast.add({
        title: nextStatus
          ? `Diskon "${target.name}" diaktifkan`
          : `Diskon "${target.name}" dinonaktifkan`,
      });
      return true;
    },
    [authorizedFetch, discounts, fetchDiscounts]
  );

  const deleteDiscount = useCallback(
    async (id: string): Promise<boolean> => {
      const target = discounts.find((d) => d.id === id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));

      try {
        const res = await authorizedFetch(`/discounts/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          void fetchDiscounts(true);
        }
      } catch {
        // Local state already updated
      }

      if (target) {
        toast.add({ title: `Diskon "${target.name}" berhasil dihapus` });
      }
      return true;
    },
    [authorizedFetch, discounts, fetchDiscounts]
  );

  const deleteMultiple = useCallback(
    async (ids: string[]): Promise<boolean> => {
      const set = new Set(ids);
      setDiscounts((prev) => prev.filter((d) => !set.has(d.id)));

      try {
        await Promise.all(
          ids.map((id) =>
            authorizedFetch(`/discounts/${id}`, { method: "DELETE" }).catch(
              () => null
            )
          )
        );
        void fetchDiscounts(true);
      } catch {
        // Handled
      }

      toast.add({ title: `${ids.length} diskon berhasil dihapus` });
      return true;
    },
    [authorizedFetch, fetchDiscounts]
  );

  return {
    discounts,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    refetch: fetchDiscounts,
    createDiscount,
    updateDiscount,
    toggleStatus,
    deleteDiscount,
    deleteMultiple,
  };
}
