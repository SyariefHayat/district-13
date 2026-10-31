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
