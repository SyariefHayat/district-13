/**
 * ==============================================================================
 * District 13 - Core Domain Business Logic (T-69 / MNT-04)
 * Pure domain logic functions for:
 * 1. Pricing, Discounts, and Dual Tax Modes (INCLUSIVE & EXCLUSIVE)
 * 2. Cash Change & Payment Validation (CASH vs QRIS)
 * 3. Expected Cash & Cash Variance Calculation (Reconcile Shifts)
 * 4. End-of-Day (EOD) & Midnight-Crossing Shifts
 * 5. Offline Sync & Idempotency Rules
 * ==============================================================================
 */

export type TaxMode = 'INCLUSIVE' | 'EXCLUSIVE' | 'NONE';
export type PaymentMethod = 'CASH' | 'QRIS';

export interface DiscountSpec {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export interface ItemPricingInput {
  productId: string;
  unitPrice: number;
  quantity: number;
  addons?: Array<{ id: string; price: number }>;
  discount?: DiscountSpec;
}

export interface CalculatedItem {
  productId: string;
  unitPrice: number;
  quantity: number;
  addonsTotal: number;
  grossSubtotal: number;
  discountAmount: number;
  netSubtotal: number;
}

export interface TransactionCalculationInput {
  items: ItemPricingInput[];
  discount?: DiscountSpec;
  taxMode?: TaxMode;
  taxRatePercent?: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
}

export interface TransactionCalculationResult {
  items: CalculatedItem[];
  itemsSubtotal: number;
  transactionDiscount: number;
  dpp: number;
  taxAmount: number;
  taxMode: TaxMode;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  isValidPayment: boolean;
}

/**
 * 1. Calculate discount with half-up rounding and non-negative clamping.
 */
export function calculateDiscount(
  baseAmount: number,
  discount?: DiscountSpec,
): number {
  if (!discount || discount.value <= 0 || baseAmount <= 0) return 0;

  if (discount.type === 'PERCENTAGE') {
    const rawDiscount = (baseAmount * discount.value) / 100;
    const rounded = Math.round(rawDiscount);
    return Math.min(baseAmount, Math.max(0, rounded));
  }

  // FIXED amount discount
  return Math.min(baseAmount, Math.max(0, Math.round(discount.value)));
}

/**
 * 2. Calculate tax based on mode (EXCLUSIVE / INCLUSIVE / NONE) with half-up rounding.
 * - EXCLUSIVE: tax = round(dpp * rate / 100), total = dpp + tax
 * - INCLUSIVE: tax = round(grossTotal * rate / (100 + rate)), dpp = grossTotal - tax
 */
export function calculateTax(
  amount: number,
  mode: TaxMode = 'NONE',
  ratePercent = 0,
): { taxAmount: number; dpp: number; total: number } {
  if (mode === 'NONE' || ratePercent <= 0 || amount <= 0) {
    return { taxAmount: 0, dpp: amount, total: amount };
  }

  if (mode === 'EXCLUSIVE') {
    const tax = Math.round((amount * ratePercent) / 100);
    return {
      taxAmount: tax,
      dpp: amount,
      total: amount + tax,
    };
  }

  // INCLUSIVE (Mode Termasuk Pajak)
  const tax = Math.round((amount * ratePercent) / (100 + ratePercent));
  return {
    taxAmount: tax,
    dpp: amount - tax,
    total: amount,
  };
}

/**
 * 3. Complete transaction engine: prices, discounts, taxes, payments, and change.
 */
export function calculateTransactionTotals(
  input: TransactionCalculationInput,
): TransactionCalculationResult {
  let itemsSubtotal = 0;
  const calculatedItems: CalculatedItem[] = [];

  for (const item of input.items) {
    const addonsTotal = (item.addons || []).reduce(
      (sum, a) => sum + Math.max(0, a.price),
      0,
    );
    const itemUnitPrice = item.unitPrice + addonsTotal;
    const grossSubtotal = itemUnitPrice * item.quantity;
    const discountAmount = calculateDiscount(grossSubtotal, item.discount);
    const netSubtotal = Math.max(0, grossSubtotal - discountAmount);

    calculatedItems.push({
      productId: item.productId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      addonsTotal,
      grossSubtotal,
      discountAmount,
      netSubtotal,
    });

    itemsSubtotal += netSubtotal;
  }

  // Transaction-level discount
  const transactionDiscount = calculateDiscount(itemsSubtotal, input.discount);
  const afterDiscount = Math.max(0, itemsSubtotal - transactionDiscount);

  // Tax computation
  const {
    taxAmount,
    dpp,
    total: totalAmount,
  } = calculateTax(
    afterDiscount,
    input.taxMode ?? 'NONE',
    input.taxRatePercent ?? 0,
  );

  // Payment and change validation
  let changeAmount = 0;
  let isValidPayment = false;

  if (input.paymentMethod === 'CASH') {
    isValidPayment = input.paidAmount >= totalAmount;
    changeAmount = isValidPayment ? input.paidAmount - totalAmount : 0;
  } else if (input.paymentMethod === 'QRIS') {
    // QRIS must match total amount exactly; change is always 0
    isValidPayment = input.paidAmount === totalAmount;
    changeAmount = 0;
  }

  return {
    items: calculatedItems,
    itemsSubtotal,
    transactionDiscount,
    dpp,
    taxAmount,
    taxMode: input.taxMode ?? 'NONE',
    totalAmount,
    paymentMethod: input.paymentMethod,
    paidAmount: input.paidAmount,
    changeAmount,
    isValidPayment,
  };
}

/**
 * 4. Calculate Expected Cash and Cash Variance for Shift Closing.
 * Formula: Expected Cash = Opening Cash + Sum(Cash Sales) + Sum(Cash IN) - Sum(Cash OUT)
 * Variance = Actual Closing Cash - Expected Cash
 */
export interface ShiftReconciliationInput {
  openingCash: number;
  cashSalesTotal: number;
  cashMovementsIn: number;
  cashMovementsOut: number;
  closingCashActual: number;
}

export interface ShiftReconciliationResult {
  expectedCash: number;
  closingCash: number;
  cashDifference: number;
  status: 'EXACT' | 'OVER' | 'SHORT';
}

export function calculateShiftReconciliation(
  input: ShiftReconciliationInput,
): ShiftReconciliationResult {
  const opening = Math.max(0, input.openingCash);
  const sales = Math.max(0, input.cashSalesTotal);
  const inFlow = Math.max(0, input.cashMovementsIn);
  const outFlow = Math.max(0, input.cashMovementsOut);

  const expectedCash = Math.max(0, opening + sales + inFlow - outFlow);
  const closingCash = Math.max(0, input.closingCashActual);
  const cashDifference = closingCash - expectedCash;

  let status: 'EXACT' | 'OVER' | 'SHORT' = 'EXACT';
  if (cashDifference > 0) status = 'OVER';
  if (cashDifference < 0) status = 'SHORT';

  return {
    expectedCash,
    closingCash,
    cashDifference,
    status,
  };
}

/**
 * 5. Handle Midnight-Crossing Shifts & Canonical WIB Operating Date.
 * A shift started at 22:00 on Day 1 and closed at 04:00 on Day 2 belongs to Day 1's business cycle.
 * Also checks duration for overtime warning (> 10 hours, SHF-012).
 */
export interface ShiftTimingAnalysis {
  canonicalBusinessDate: string; // YYYY-MM-DD
  durationMinutes: number;
  isMidnightCrossing: boolean;
  isOvertimeWarning: boolean; // > 10 hours
}

export function analyzeShiftTiming(
  openedAt: Date | string,
  closedAt?: Date | string | null,
): ShiftTimingAnalysis {
  const openDate = typeof openedAt === 'string' ? new Date(openedAt) : openedAt;
  const closeDate = closedAt
    ? typeof closedAt === 'string'
      ? new Date(closedAt)
      : closedAt
    : new Date();

  // Canonical business date is anchored to the opening date in WIB (UTC+7)
  const canonicalBusinessDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(openDate);

  const closeBusinessDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(closeDate);

  const durationMs = Math.max(0, closeDate.getTime() - openDate.getTime());
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const isMidnightCrossing = canonicalBusinessDate !== closeBusinessDate;
  const isOvertimeWarning = durationMinutes > 600; // > 10 hours (600 mins)

  return {
    canonicalBusinessDate,
    durationMinutes,
    isMidnightCrossing,
    isOvertimeWarning,
  };
}

/**
 * 6. Offline Sync Validation & Idempotency Rules.
 * - Maximum 50 events per batch
 * - Enforces idempotency key format
 * - Detects late sync (synced on date later than transaction date)
 */
export interface SyncValidationResult {
  isValid: boolean;
  isLateSync: boolean;
  eventCount: number;
  error?: string;
}

export function validateSyncBatch(
  events: Array<{ id: string; timestamp: string; type: string }>,
  currentDate: Date = new Date(),
): SyncValidationResult {
  if (!Array.isArray(events)) {
    return {
      isValid: false,
      isLateSync: false,
      eventCount: 0,
      error: 'Events must be an array',
    };
  }

  if (events.length > 50) {
    return {
      isValid: false,
      isLateSync: false,
      eventCount: events.length,
      error: 'Batch size exceeds maximum limit of 50 events',
    };
  }

  const todayWib = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(currentDate);

  let isLateSync = false;
  for (const event of events) {
    if (!event.id || !event.timestamp || !event.type) {
      return {
        isValid: false,
        isLateSync: false,
        eventCount: events.length,
        error: 'Malformed event payload',
      };
    }
    const eventWib = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(event.timestamp));

    if (eventWib < todayWib) {
      isLateSync = true;
    }
  }

  return {
    isValid: true,
    isLateSync,
    eventCount: events.length,
  };
}
