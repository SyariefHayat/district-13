export type DiscountType = "percentage" | "fixed";
export type DiscountApplyMode = "automatic" | "manual";

export interface DiscountItem {
  id: string;
  name: string;
  code: string;
  type: DiscountType;
  applyMode: DiscountApplyMode; // "automatic" (sistem kasir auto apply saat checkout) | "manual" (kasir memilih langsung di POS)
  value: number;
  minPurchase: number;
  maxDiscount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  usageCount: number; // Berapa kali diskon telah diterapkan pada transaksi kasir
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateDiscountInput = Omit<
  DiscountItem,
  "id" | "usageCount" | "createdAt" | "updatedAt"
>;

export type UpdateDiscountInput = Partial<CreateDiscountInput>;

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDiscountValue = (type: DiscountType, value: number) => {
  if (type === "percentage") {
    return `${value}%`;
  }
  return formatIDR(value);
};

export const formatDiscountDate = (dateString?: string | null) => {
  if (!dateString) return "Selamanya";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

export const formatDiscountPeriod = (
  startDate?: string | null,
  endDate?: string | null
) => {
  if (!startDate && !endDate) return "Selamanya";
  if (startDate && !endDate) return `Mulai ${formatDiscountDate(startDate)}`;
  if (!startDate && endDate) return `s/d ${formatDiscountDate(endDate)}`;
  return `${formatDiscountDate(startDate)} - ${formatDiscountDate(endDate)}`;
};

export const INITIAL_DISCOUNTS: DiscountItem[] = [
  {
    id: "disc-1",
    name: "Diskon Teman Warkop 20%",
    code: "TEMAN-20",
    type: "percentage",
    applyMode: "manual",
    value: 20,
    minPurchase: 0,
    maxDiscount: null,
    startDate: "2026-10-01",
    endDate: null,
    isActive: true,
    usageCount: 142,
    description:
      "Diskon manual kasir 20% untuk teman/kerabat yang mampir ngopi di warkop",
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "disc-2",
    name: "Potongan Sahabat Ngopi Rp 5.000",
    code: "SOBAT-5K",
    type: "fixed",
    applyMode: "manual",
    value: 5000,
    minPurchase: 0,
    maxDiscount: null,
    startDate: "2026-10-15",
    endDate: null,
    isActive: true,
    usageCount: 89,
    description:
      "Potongan langsung Rp 5.000 tanpa batas minimum belanja untuk sahabat",
    createdAt: "2026-10-15T07:00:00Z",
  },
  {
    id: "disc-3",
    name: "Diskon Kawan Nongkrong 15%",
    code: "KAWAN-15",
    type: "percentage",
    applyMode: "manual",
    value: 15,
    minPurchase: 0,
    maxDiscount: null,
    startDate: "2026-11-01",
    endDate: null,
    isActive: true,
    usageCount: 64,
    description: "Diskon 15% untuk teman tongkrongan warkop",
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "disc-4",
    name: "Traktir Kawan Rp 10.000",
    code: "TRAKTIR-10K",
    type: "fixed",
    applyMode: "manual",
    value: 10000,
    minPurchase: 0,
    maxDiscount: null,
    startDate: "2026-09-01",
    endDate: null,
    isActive: true,
    usageCount: 37,
    description: "Potongan Rp 10.000 untuk pesanan teman satu meja",
    createdAt: "2026-09-01T09:00:00Z",
  },
  {
    id: "disc-5",
    name: "Diskon Komunitas Warkop 10%",
    code: "KOMUNITAS-10",
    type: "percentage",
    applyMode: "manual",
    value: 10,
    minPurchase: 0,
    maxDiscount: null,
    startDate: "2026-10-25",
    endDate: null,
    isActive: true,
    usageCount: 53,
    description: "Diskon khusus teman komunitas/club yang berkumpul di warkop",
    createdAt: "2026-10-25T00:00:00Z",
  },
];
