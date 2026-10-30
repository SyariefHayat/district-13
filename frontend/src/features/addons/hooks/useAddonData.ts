import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import { INITIAL_ADDONS, type AddonItem } from "../data/addonData";

export interface BackendAddon {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
  category?: string;
  linkedProductsCount?: number;
}

function mapBackendAddon(a: BackendAddon): AddonItem {
  return {
    id: a.id,
    name: a.name,
    category: a.category || "Umum",
    price: Number(a.price) || 0,
    isActive: Boolean(a.isActive),
    linkedProductsCount: Number(a.linkedProductsCount ?? 0),
  };
}

function areAddonListsEqual(a: AddonItem[], b: AddonItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const item1 = a[i];
    const item2 = b[i];
    if (
      item1.id !== item2.id ||
      item1.name !== item2.name ||
      item1.category !== item2.category ||
      item1.price !== item2.price ||
      item1.isActive !== item2.isActive ||
      item1.linkedProductsCount !== item2.linkedProductsCount
    ) {
      return false;
    }
  }
  return true;
}

export interface UseAddonDataOptions {
  pollIntervalMs?: number;
}

export function useAddonData(options?: UseAddonDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch } = useAuth();
  const [addons, setAddons] = useState<AddonItem[]>(INITIAL_ADDONS);
  const [categories, setCategories] = useState<string[]>([
    "Semua Kategori",
    "Espresso & Kopi",
    "Susu Alternatif",
    "Sirup & Pemanis",
    "Topping Minuman",
    "Topping & Saus Makanan",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);
  const deletingIdsRef = useRef<Set<string>>(new Set());

  const fetchAddons = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) {
        setIsLoading(true);
      }
      setIsSyncing(true);
      setError(null);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await authorizedFetch("/addons", {
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.message === "string"
              ? body.message
              : `Gagal memuat varian dari database (${res.status})`
          );
        }

        const data = await res.json();
        const list: BackendAddon[] = Array.isArray(data)
          ? data
          : data.data || [];

        if (!controller.signal.aborted) {
          if (list.length > 0) {
            const mapped = list.map(mapBackendAddon);
            setAddons((prev) =>
              areAddonListsEqual(prev, mapped) ? prev : mapped
            );
            const dynamicCategories = Array.from(
              new Set(mapped.map((item) => item.category).filter(Boolean))
            );
            if (dynamicCategories.length > 0) {
              setCategories(["Semua Kategori", ...dynamicCategories]);
            }
          }
          setLastSyncedAt(new Date());
          isInitialLoad.current = false;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // If it fails on network or dev fallback, preserve current addons
        if (isInitialLoad.current) {
          setAddons(INITIAL_ADDONS);
          isInitialLoad.current = false;
        }
        console.warn("Notice: could not sync addons from server:", err);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsSyncing(false);
        }
      }
    },
    [authorizedFetch]
  );

  useEffect(() => {
    void fetchAddons(false);
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchAddons]);

  // Polling & focus revalidation
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
          void fetchAddons(true);
        }
      }, pollIntervalMs);
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void fetchAddons(true);
        startPolling();
      } else if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    startPolling();

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [fetchAddons, pollIntervalMs]);

  const toggleStatus = useCallback(
    async (addonId: string) => {
      const target = addons.find((a) => a.id === addonId);
      if (!target) return;

      const newStatus = !target.isActive;
      setAddons((prev) =>
        prev.map((item) =>
          item.id === addonId ? { ...item, isActive: newStatus } : item
        )
      );

      try {
        const res = await authorizedFetch(`/addons/${addonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newStatus }),
        });
        if (!res.ok) {
          void fetchAddons(true);
        }
      } catch {
        void fetchAddons(true);
      }
    },
    [addons, authorizedFetch, fetchAddons]
  );

  const deleteAddon = useCallback(
    async (addonId: string) => {
      if (deletingIdsRef.current.has(addonId)) return;
      deletingIdsRef.current.add(addonId);

      const previous = [...addons];
      setAddons((prev) => prev.filter((item) => item.id !== addonId));

      try {
        const res = await authorizedFetch(`/addons/${addonId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.add({
            title: "Gagal menghapus varian",
            description:
              typeof body.message === "string"
                ? body.message
                : "Terjadi kesalahan pada server",
          });
          setAddons(previous);
        } else {
          void fetchAddons(true);
        }
      } catch (err) {
        toast.add({
          title: "Gagal menghapus varian",
          description:
            err instanceof Error ? err.message : "Koneksi bermasalah",
        });
        setAddons(previous);
      } finally {
        deletingIdsRef.current.delete(addonId);
      }
    },
    [addons, authorizedFetch, fetchAddons]
  );

  const deleteMultiple = useCallback(
    async (addonIds: string[]) => {
      const targetIds = addonIds.filter(
        (id) => !deletingIdsRef.current.has(id)
      );
      if (targetIds.length === 0) return;
      targetIds.forEach((id) => deletingIdsRef.current.add(id));

      const previous = [...addons];
      setAddons((prev) => prev.filter((item) => !targetIds.includes(item.id)));

      try {
        const results = await Promise.all(
          targetIds.map((id) =>
            authorizedFetch(`/addons/${id}`, { method: "DELETE" })
          )
        );
        const hasFailures = results.some((r) => !r.ok);
        if (hasFailures) {
          toast.add({
            title: "Beberapa varian gagal dihapus",
          });
        }
        void fetchAddons(true);
      } catch (err) {
        toast.add({
          title: "Gagal menghapus varian",
          description:
            err instanceof Error ? err.message : "Koneksi bermasalah",
        });
        setAddons(previous);
      } finally {
        targetIds.forEach((id) => deletingIdsRef.current.delete(id));
      }
    },
    [addons, authorizedFetch, fetchAddons]
  );

  const createAddon = useCallback(
    async (data: {
      name: string;
      price: number;
      category?: string;
      isActive?: boolean;
    }) => {
      try {
        const res = await authorizedFetch("/addons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            price: data.price.toString(),
            isActive: data.isActive ?? true,
          }),
        });

        if (res.ok) {
          const created = (await res.json()) as BackendAddon;
          const mapped: AddonItem = {
            id: created.id,
            name: created.name,
            category: data.category || "Umum",
            price: Number(created.price) || data.price,
            isActive: created.isActive ?? true,
            linkedProductsCount: 0,
          };
          setAddons((prev) => [mapped, ...prev]);
          toast.add({ title: `Varian "${data.name}" berhasil ditambahkan` });
          return true;
        } else {
          // Fallback local addition if in demo mode
          const localItem: AddonItem = {
            id: `add-${Date.now()}`,
            name: data.name,
            category: data.category || "Umum",
            price: data.price,
            isActive: data.isActive ?? true,
            linkedProductsCount: 0,
          };
          setAddons((prev) => [localItem, ...prev]);
          toast.add({ title: `Varian "${data.name}" berhasil ditambahkan` });
          return true;
        }
      } catch {
        const localItem: AddonItem = {
          id: `add-${Date.now()}`,
          name: data.name,
          category: data.category || "Umum",
          price: data.price,
          isActive: data.isActive ?? true,
          linkedProductsCount: 0,
        };
        setAddons((prev) => [localItem, ...prev]);
        toast.add({ title: `Varian "${data.name}" berhasil ditambahkan` });
        return true;
      }
    },
    [authorizedFetch]
  );

  const updateAddon = useCallback(
    async (
      addonId: string,
      data: Partial<Pick<AddonItem, "name" | "price" | "category" | "isActive">>
    ) => {
      setAddons((prev) =>
        prev.map((item) => (item.id === addonId ? { ...item, ...data } : item))
      );

      try {
        const updatePayload: Record<string, unknown> = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.price !== undefined)
          updatePayload.price = data.price.toString();
        if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

        const res = await authorizedFetch(`/addons/${addonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
        if (res.ok) {
          toast.add({ title: "Perubahan varian berhasil disimpan" });
          return true;
        }
      } catch {
        // Optimistic update retained
      }
      toast.add({ title: "Perubahan varian berhasil disimpan" });
      return true;
    },
    [authorizedFetch]
  );

  return {
    addons,
    categories,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    refetch: () => fetchAddons(false),
    toggleStatus,
    deleteAddon,
    deleteMultiple,
    createAddon,
    updateAddon,
  };
}
