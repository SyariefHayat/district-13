export interface PosProductItem {
  id: string;
  name: string;
  sku?: string;
  price: number;
  categoryName: string;
  categoryId?: string;
  displayStock: number;
  stock?: number;
  isAvailable: boolean;
  isActive: boolean;
  images?: string[];
  addons?: PosAddon[];
}

export interface PosAddon {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface PosCartItem {
  cartItemId: string; // unique key: `${productId}-${addonIds.join('-')}-${notes}`
  productId: string;
  name: string;
  categoryName: string;
  unitPrice: number;
  quantity: number;
  selectedAddons: PosAddon[];
  notes: string;
  displayStock: number;
}

export interface PosDiscount {
  id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed";
  applyMode: "automatic" | "manual";
  value: number;
  minPurchase: number;
  maxDiscount?: number | null;
  isActive: boolean;
}

export interface PosCompletedTransaction {
  id: string;
  transactionNumber: string;
  shiftId: string;
  cashierName: string;
  createdAt: string;
  items: {
    productId: string;
    productName: string;
    categoryName?: string;
    quantity: number;
    unitPrice: number;
    subtotalPrice: number;
    addons?: PosAddon[];
    notes?: string;
  }[];
  subtotalAmount: number;
  discountAmount: number;
  discountReason?: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: "CASH" | "QRIS";
}
