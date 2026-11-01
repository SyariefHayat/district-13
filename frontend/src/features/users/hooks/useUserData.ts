import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast";
import {
  mapBackendUser,
  type BackendUser,
  type UserItem,
  type UserRole,
} from "../data/userData";

export interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

function areUserListsEqual(a: UserItem[], b: UserItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const item1 = a[i];
    const item2 = b[i];
    if (
      item1.id !== item2.id ||
      item1.username !== item2.username ||
      item1.role !== item2.role ||
      item1.isActive !== item2.isActive ||
      item1.updatedAt !== item2.updatedAt
    ) {
      return false;
    }
  }
  return true;
}

export interface UseUserDataOptions {
  pollIntervalMs?: number;
}

export function useUserData(options?: UseUserDataOptions) {
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;
  const { authorizedFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isInitialLoad = useRef(true);
  const mutatingIdsRef = useRef<Set<string>>(new Set());

  const fetchUsers = useCallback(
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
        const response = await authorizedFetch("/users", {
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal memuat pengguna (${response.status})`;
          throw new Error(
            Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
          );
        }

        const rawData = (await response.json()) as BackendUser[];
        const freshUsers = Array.isArray(rawData)
          ? rawData.map(mapBackendUser)
          : [];

        setUsers((current) => {
          if (areUserListsEqual(current, freshUsers)) {
            return current;
          }
          return freshUsers;
        });

        setLastSyncedAt(new Date());
        setError(null);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        const msg =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan memuat data dari server backend";
        if (isInitialLoad.current) {
          setError(msg);
        }
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
    void fetchUsers(false);
    const interval = setInterval(() => {
      void fetchUsers(true);
    }, pollIntervalMs);

    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchUsers, pollIntervalMs]);

  const createUser = useCallback(
    async (input: CreateUserInput): Promise<boolean> => {
      try {
        const response = await authorizedFetch("/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal menambah karyawan (${response.status})`;
          toast.add({
            title: "Gagal membuat pengguna",
            description: Array.isArray(errDetail)
              ? errDetail.join(", ")
              : String(errDetail),
          });
          return false;
        }

        toast.add({
          title: "Karyawan berhasil dibuat",
          description: `Akun "${input.username}" telah terdaftar sebagai ${input.role}.`,
        });
        await fetchUsers(true);
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal membuat karyawan",
          description:
            err instanceof Error ? err.message : "Kesalahan koneksi ke server",
        });
        return false;
      }
    },
    [authorizedFetch, fetchUsers]
  );

  const updateUser = useCallback(
    async (id: string, input: UpdateUserInput): Promise<boolean> => {
      try {
        const response = await authorizedFetch(`/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal memperbarui pengguna (${response.status})`;
          toast.add({
            title: "Gagal memperbarui pengguna",
            description: Array.isArray(errDetail)
              ? errDetail.join(", ")
              : String(errDetail),
          });
          return false;
        }

        toast.add({
          title: "Data pengguna diperbarui",
          description: "Perubahan informasi pengguna berhasil disimpan.",
        });
        await fetchUsers(true);
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal memperbarui pengguna",
          description:
            err instanceof Error ? err.message : "Kesalahan koneksi ke server",
        });
        return false;
      }
    },
    [authorizedFetch, fetchUsers]
  );

  const toggleUserStatus = useCallback(
    async (userItem: UserItem): Promise<boolean> => {
      if (mutatingIdsRef.current.has(userItem.id)) return false;
      mutatingIdsRef.current.add(userItem.id);

      const newStatus = !userItem.isActive;
      // Optimistic UI update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userItem.id ? { ...u, isActive: newStatus } : u
        )
      );

      try {
        const endpoint =
          userItem.role === "CASHIER"
            ? `/users/${userItem.id}/status`
            : `/users/${userItem.id}`;
        const response = await authorizedFetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newStatus }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const msg =
            body?.message || `Gagal mengubah status (${response.status})`;
          throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
        }

        toast.add({
          title: newStatus ? "Akun diaktifkan" : "Akun dinonaktifkan",
          description: `Status pengguna "${userItem.username}" berhasil diubah.`,
        });
        await fetchUsers(true);
        return true;
      } catch (err) {
        // Rollback optimistic update on failure
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userItem.id ? { ...u, isActive: userItem.isActive } : u
          )
        );
        toast.add({
          title: "Gagal mengubah status pengguna",
          description:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan pada server",
        });
        return false;
      } finally {
        mutatingIdsRef.current.delete(userItem.id);
      }
    },
    [authorizedFetch, fetchUsers]
  );

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await authorizedFetch(`/users/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errDetail =
            body?.message || `Gagal menghapus pengguna (${response.status})`;
          toast.add({
            title: "Gagal menghapus pengguna",
            description: Array.isArray(errDetail)
              ? errDetail.join(", ")
              : String(errDetail),
          });
          return false;
        }

        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast.add({
          title: "Pengguna dihapus",
          description: "Akun pengguna berhasil dihapus dari sistem.",
        });
        await fetchUsers(true);
        return true;
      } catch (err) {
        toast.add({
          title: "Gagal menghapus pengguna",
          description:
            err instanceof Error ? err.message : "Kesalahan koneksi ke server",
        });
        return false;
      }
    },
    [authorizedFetch, fetchUsers]
  );

  const deleteMultiple = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (ids.length === 0) return true;
      let successCount = 0;
      for (const id of ids) {
        try {
          const res = await authorizedFetch(`/users/${id}`, {
            method: "DELETE",
          });
          if (res.ok) successCount++;
        } catch {
          // ignore individual failures
        }
      }

      setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
      toast.add({
        title: "Penghapusan massal selesai",
        description: `${successCount} dari ${ids.length} akun berhasil dihapus.`,
      });
      await fetchUsers(true);
      return successCount > 0;
    },
    [authorizedFetch, fetchUsers]
  );

  return {
    users,
    currentUser,
    isLoading,
    isSyncing,
    lastSyncedAt,
    error,
    refetch: () => fetchUsers(false),
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    deleteMultiple,
  };
}
