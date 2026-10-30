export interface WarehouseInventoryItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  category: string;
  image?: string;
  warehouseStock: number;
  displayStock: number;
  totalStock: number;
  minStockThreshold: number;
  costPrice: number;
  sellingPrice: number;
  updatedAt: string;
}

export type WarehouseStockStatus =
  "in_stock" | "low_stock" | "needs_display_transfer" | "out_of_stock";

export function getWarehouseStockStatus(
  item: WarehouseInventoryItem
): WarehouseStockStatus {
  if (item.warehouseStock === 0 && item.displayStock === 0)
    return "out_of_stock";
  if (item.displayStock <= 3 && item.warehouseStock > 0)
    return "needs_display_transfer";
  if (item.warehouseStock <= item.minStockThreshold) return "low_stock";
  return "in_stock";
}

export function getWarehouseStockRecommendation(item: WarehouseInventoryItem): {
  status: WarehouseStockStatus;
  label: string;
  badgeClass: string;
  actionHint?: "transfer" | "restock";
} {
  if (item.warehouseStock === 0 && item.displayStock === 0) {
    return {
      status: "out_of_stock",
      label: "Habis Total",
      badgeClass:
        "border-destructive/30 bg-destructive/10 text-destructive font-medium",
      actionHint: "restock",
    };
  }
  if (item.displayStock <= 3 && item.warehouseStock > 0) {
    return {
      status: "needs_display_transfer",
      label: "Perlu Isi Etalase",
      badgeClass:
        "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium",
      actionHint: "transfer",
    };
  }
  if (item.warehouseStock <= item.minStockThreshold) {
    return {
      status: "low_stock",
      label: "Gudang Menipis",
      badgeClass:
        "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium",
      actionHint: "restock",
    };
  }
  return {
    status: "in_stock",
    label: "Stok Aman",
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium",
  };
}

export interface WarehouseMovementItem {
  id: string;
  productId: string;
  productName: string;
  fromLocation: "WAREHOUSE" | "DISPLAY" | null;
  toLocation: "WAREHOUSE" | "DISPLAY" | null;
  type: "STOCK_IN" | "TRANSFER" | "SALE" | "VOID_RETURN";
  quantity: number;
  userId: string;
  username: string;
  transactionId?: string | null;
  createdAt: string;
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const WAREHOUSE_CATEGORIES = [
  "Semua Kategori",
  "Kopi",
  "Bahan Baku",
  "Packaging",
  "Minuman",
  "Snack & Makanan",
];

export const INITIAL_WAREHOUSE_ITEMS: WarehouseInventoryItem[] = [
  {
    id: "wh-1",
    productId: "p-kopi-arabica",
    name: "Biji Kopi Arabica Gayo (1kg)",
    sku: "RAW-KOP-001",
    category: "Bahan Baku",
    warehouseStock: 45,
    displayStock: 8,
    totalStock: 53,
    minStockThreshold: 10,
    costPrice: 120000,
    sellingPrice: 165000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wh-2",
    productId: "p-kopi-robusta",
    name: "Biji Kopi Robusta Dampit (1kg)",
    sku: "RAW-KOP-002",
    category: "Bahan Baku",
    warehouseStock: 60,
    displayStock: 12,
    totalStock: 72,
    minStockThreshold: 15,
    costPrice: 75000,
    sellingPrice: 105000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wh-3",
    productId: "p-susu-uht",
    name: "Susu UHT Fresh Full Cream (1L)",
    sku: "RAW-SUS-001",
    category: "Bahan Baku",
    warehouseStock: 85,
    displayStock: 24,
    totalStock: 109,
    minStockThreshold: 20,
    costPrice: 17500,
    sellingPrice: 22000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wh-4",
    productId: "p-gula-aren",
    name: "Gula Aren Cair Premium (1L)",
    sku: "RAW-GLA-001",
    category: "Bahan Baku",
    warehouseStock: 28,
    displayStock: 6,
    totalStock: 34,
    minStockThreshold: 10,
    costPrice: 28000,
    sellingPrice: 38000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wh-5",
    productId: "p-cup-16oz",
    name: "Paper Cup Hot 16oz + Lid (50pcs)",
    sku: "PKG-CUP-016",
    category: "Packaging",
    warehouseStock: 8,
    displayStock: 3,
    totalStock: 11,
    minStockThreshold: 10,
    costPrice: 35000,
    sellingPrice: 45000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wh-6",
    productId: "p-cup-plastic",
    name: "Cup Plastik Cold 14oz (50pcs)",
    sku: "PKG-CUP-014",
    category: "Packaging",
    warehouseStock: 4,
    displayStock: 2,
    totalStock: 6,
    minStockThreshold: 10,
    costPrice: 25000,
    sellingPrice: 32000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wh-7",
    productId: "p-sedotan-paper",
    name: "Sedotan Kertas Steril (100pcs)",
    sku: "PKG-STR-001",
    category: "Packaging",
    warehouseStock: 0,
    displayStock: 0,
    totalStock: 0,
    minStockThreshold: 5,
    costPrice: 15000,
    sellingPrice: 20000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wh-8",
    productId: "p-syrup-vanilla",
    name: "Syrup Vanilla Gourmet (750ml)",
    sku: "RAW-SYR-001",
    category: "Bahan Baku",
    warehouseStock: 18,
    displayStock: 4,
    totalStock: 22,
    minStockThreshold: 5,
    costPrice: 85000,
    sellingPrice: 110000,
    updatedAt: new Date().toISOString(),
  },
];
