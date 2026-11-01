export type UserRole = "OWNER" | "ADMIN" | "CASHIER";

export interface BackendUser {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserItem {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function mapBackendUser(u: BackendUser): UserItem {
  return {
    id: String(u.id),
    username: String(u.username),
    role: u.role,
    isActive: Boolean(u.isActive),
    createdAt: u.createdAt
      ? typeof u.createdAt === "string"
        ? u.createdAt
        : u.createdAt.toISOString()
      : "",
    updatedAt: u.updatedAt
      ? typeof u.updatedAt === "string"
        ? u.updatedAt
        : u.updatedAt.toISOString()
      : "",
  };
}

export const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    description: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    badgeClass: string;
  }
> = {
  OWNER: {
    label: "OWNER",
    description:
      "Akses penuh terhadap seluruh modul sistem, inventori, dan pengaturan.",
    variant: "default",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  },
  ADMIN: {
    label: "ADMIN",
    description:
      "Mengelola katalog produk, stok inventori, dan pemantauan laporan.",
    variant: "secondary",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  },
  CASHIER: {
    label: "CASHIER",
    description:
      "Mengoperasikan transaksi POS, manajemen kasir harian, dan shift.",
    variant: "outline",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
};

export function formatUserDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}
