/**
 * Pricing calculation library (Shared across Frontend/Offline POS and Backend).
 * Fulfills REQ: SAL-004..007, SAL-005.
 */

export type TaxMode = "EXCLUSIVE" | "INCLUSIVE" | "NONE";

export interface PricingAddon {
  id: string;
  name?: string;
  price: number | string;
  quantity?: number;
}

export interface PricingItemInput {
  productId: string;
  unitPrice: number | string;
  quantity: number;
  costPrice?: number | string;
  addons?: PricingAddon[];
  discount?: {
    type: "PERCENTAGE" | "FIXED" | "AMOUNT";
    value: number | string;
  };
}

export interface CalculatedItem {
  productId: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  addonsTotal: number;
  itemSubtotal: number;
  discountAmount: number;
  lineTotal: number;
}

export interface CalculateTransactionParams {
  items: PricingItemInput[];
  discount?: {
    id?: string;
    name?: string;
    type: "PERCENTAGE" | "FIXED" | "AMOUNT";
    value: number | string;
  };
  taxMode?: TaxMode | string;
  taxRate?: number | string;
  paymentMethod?: "CASH" | "QRIS" | string;
  paidAmount?: number | string;
}

export interface CalculatedTransaction {
  items: CalculatedItem[];
  subtotal: number;
  discountAmount: number;
  dpp: number;
  taxMode: TaxMode;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  isPaymentSufficient: boolean;
}

export function roundRupiah(value: number): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  return Math.round(value);
}

export function calculateItemSubtotal(
  unitPrice: number | string,
  quantity: number,
  addons: PricingAddon[] = []
): { addonsTotal: number; subtotal: number } {
  const priceNum = Math.max(0, Number(unitPrice) || 0);
  const qty = Math.max(0, quantity || 0);

  const addonsTotal = addons.reduce((sum, a) => {
    const aPrice = Math.max(0, Number(a.price) || 0);
    const aQty = Math.max(1, a.quantity ?? 1);
    return sum + roundRupiah(aPrice * aQty);
  }, 0);

  const subtotal = roundRupiah((priceNum + addonsTotal) * qty);
  return { addonsTotal, subtotal };
}

export function calculateDiscount(
  subtotal: number,
  discount?: {
    type: "PERCENTAGE" | "FIXED" | "AMOUNT";
    value: number | string;
  }
): number {
  if (!discount || subtotal <= 0) return 0;
  const val = Number(discount.value) || 0;
  if (val <= 0) return 0;

  let rawDiscount = 0;
  if (discount.type === "PERCENTAGE") {
    const clampedPercent = Math.min(100, Math.max(0, val));
    rawDiscount = (subtotal * clampedPercent) / 100;
  } else {
    rawDiscount = val;
  }

  const rounded = roundRupiah(rawDiscount);
  return Math.min(subtotal, Math.max(0, rounded));
}

export function calculateTax(
  taxableAmount: number,
  mode: TaxMode | string = "NONE",
  rate: number | string = 0
): { taxAmount: number; dpp: number; total: number } {
  const taxRate = Math.max(0, Number(rate) || 0);
  const normalizedMode = String(mode || "NONE")
    .toUpperCase()
    .trim() as TaxMode;

  if (taxRate <= 0 || normalizedMode === "NONE") {
    return {
      taxAmount: 0,
      dpp: taxableAmount,
      total: taxableAmount,
    };
  }

  if (normalizedMode === "EXCLUSIVE") {
    const taxAmount = roundRupiah((taxableAmount * taxRate) / 100);
    return {
      taxAmount,
      dpp: taxableAmount,
      total: taxableAmount + taxAmount,
    };
  }

  if (normalizedMode === "INCLUSIVE") {
    const taxAmount = roundRupiah((taxableAmount * taxRate) / (100 + taxRate));
    const dpp = taxableAmount - taxAmount;
    return {
      taxAmount,
      dpp,
      total: taxableAmount,
    };
  }

  return {
    taxAmount: 0,
    dpp: taxableAmount,
    total: taxableAmount,
  };
}

export function calculateTransactionTotals(
  params: CalculateTransactionParams
): CalculatedTransaction {
  const calculatedItems: CalculatedItem[] = [];
  let subtotal = 0;

  for (const item of params.items) {
    const unitPrice = roundRupiah(Number(item.unitPrice) || 0);
    const costPrice = roundRupiah(Number(item.costPrice) || 0);
    const quantity = Math.max(1, item.quantity || 1);

    const { addonsTotal, subtotal: itemSub } = calculateItemSubtotal(
      unitPrice,
      quantity,
      item.addons || []
    );

    const itemDisc = calculateDiscount(itemSub, item.discount);
    const lineTotal = Math.max(0, itemSub - itemDisc);

    calculatedItems.push({
      productId: item.productId,
      unitPrice,
      costPrice,
      quantity,
      addonsTotal,
      itemSubtotal: itemSub,
      discountAmount: itemDisc,
      lineTotal,
    });

    subtotal += itemSub;
  }

  const transactionDiscount = calculateDiscount(subtotal, params.discount);
  const taxableBase = Math.max(0, subtotal - transactionDiscount);

  const taxModeNormalized = String(
    params.taxMode || "NONE"
  ).toUpperCase() as TaxMode;
  const taxRateNum = Number(params.taxRate) || 0;
  const { taxAmount, dpp, total } = calculateTax(
    taxableBase,
    taxModeNormalized,
    taxRateNum
  );

  const paymentMethod = (params.paymentMethod || "CASH").toUpperCase();
  const paidAmount = roundRupiah(Number(params.paidAmount) || 0);

  let isPaymentSufficient = true;
  let changeAmount = 0;

  if (paymentMethod === "CASH") {
    if (paidAmount < total) {
      isPaymentSufficient = false;
      changeAmount = 0;
    } else {
      changeAmount = paidAmount - total;
    }
  } else {
    if (paidAmount !== total) {
      isPaymentSufficient = false;
    }
    changeAmount = 0;
  }

  return {
    items: calculatedItems,
    subtotal,
    discountAmount: transactionDiscount,
    dpp,
    taxMode: taxModeNormalized,
    taxRate: taxRateNum,
    taxAmount,
    total,
    paymentMethod,
    paidAmount,
    changeAmount,
    isPaymentSufficient,
  };
}
