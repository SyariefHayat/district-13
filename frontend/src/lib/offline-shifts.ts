import { db, type LocalActiveShift, type LocalOutboxEvent } from "./db";

export interface PosCartStorageItem {
  cartItemId: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selectedAddons?: Array<{ id: string; name: string; price: number }>;
  notes?: string;
  displayStock?: number;
}

const CART_STORAGE_KEY = "district13_pos_cart";
let inMemoryCart: PosCartStorageItem[] = [];

/**
 * Retrieve active cart items from local storage
 */
export function getLocalActiveCart(): PosCartStorageItem[] {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return inMemoryCart;
}

/**
 * Persist active cart items to local storage
 */
export function setLocalActiveCart(cart: PosCartStorageItem[]): void {
  if (typeof localStorage !== "undefined") {
    try {
      if (!cart || cart.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      }
    } catch {
      // Ignore storage quota errors
    }
  }
  inMemoryCart = cart || [];
}

/**
 * Check if there is an active non-empty cart
 */
export function hasActiveCart(): boolean {
  const items = getLocalActiveCart();
  return items.length > 0;
}

/**
 * Get total item quantity in active cart
 */
export function getActiveCartTotalCount(): number {
  const items = getLocalActiveCart();
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

/**
 * Clear the active cart
 */
export function clearLocalActiveCart(): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  inMemoryCart = [];
}

/**
 * Helper to get next sequence number for outbox events
 */
async function getNextOutboxSeq(): Promise<number> {
  const lastEvent = await db.outbox.orderBy("seq").last();
  return (lastEvent?.seq || 0) + 1;
}

/**
 * Open shift locally and queue shift.open event for sync
 */
export async function openShiftLocalFirst(
  openingCash: string,
  userId: string,
  shiftIdOverride?: string
): Promise<LocalActiveShift> {
  const shiftId = shiftIdOverride || crypto.randomUUID();
  const now = new Date().toISOString();
  const nextSeq = await getNextOutboxSeq();

  const activeShiftRecord: LocalActiveShift = {
    id: "current",
    shiftId,
    userId,
    openedAt: now,
    startingCash: openingCash,
    status: "OPEN",
  };

  const outboxEvent: LocalOutboxEvent = {
    id: crypto.randomUUID(),
    seq: nextSeq,
    type: "shift.open",
    idempotencyKey: `shift_open_${shiftId}`,
    occurredAt: now,
    payload: {
      id: shiftId,
      shiftId,
      userId,
      openingCash,
      startingCash: openingCash,
      openedAt: now,
    },
    status: "pending",
    retryCount: 0,
    createdAt: now,
  };

  await db.transaction("rw", [db.activeShift, db.outbox], async () => {
    await db.activeShift.put(activeShiftRecord);
    await db.outbox.put(outboxEvent);
  });

  return activeShiftRecord;
}

/**
 * Close shift locally and queue shift.close event for sync
 */
export async function closeShiftLocalFirst(
  shiftId: string,
  closingCash: string
): Promise<void> {
  if (hasActiveCart()) {
    throw new Error(
      "Tidak dapat menutup shift karena masih ada item dalam keranjang belanja aktif."
    );
  }

  const now = new Date().toISOString();
  const nextSeq = await getNextOutboxSeq();

  const outboxEvent: LocalOutboxEvent = {
    id: crypto.randomUUID(),
    seq: nextSeq,
    type: "shift.close",
    idempotencyKey: `shift_close_${shiftId}_${Date.now()}`,
    occurredAt: now,
    payload: {
      id: shiftId,
      shiftId,
      closingCash,
      actualCash: closingCash,
      closedAt: now,
    },
    status: "pending",
    retryCount: 0,
    createdAt: now,
  };

  await db.transaction("rw", [db.activeShift, db.outbox], async () => {
    const existing = await db.activeShift.get("current");
    if (existing && existing.shiftId === shiftId) {
      await db.activeShift.put({
        ...existing,
        status: "CLOSED",
      });
    }
    await db.outbox.put(outboxEvent);
  });
}

/**
 * Record cash movement locally and queue cash.record event for sync
 */
export async function createCashMovementLocalFirst(
  shiftId: string,
  type: "IN" | "OUT",
  amount: string,
  description?: string
): Promise<void> {
  const movementId = crypto.randomUUID();
  const now = new Date().toISOString();
  const nextSeq = await getNextOutboxSeq();

  const outboxEvent: LocalOutboxEvent = {
    id: crypto.randomUUID(),
    seq: nextSeq,
    type: "cash.record",
    idempotencyKey: `cash_record_${movementId}`,
    occurredAt: now,
    payload: {
      id: movementId,
      shiftId,
      type,
      amount,
      description: description || "Mutasi kas lokal",
      occurredAt: now,
    },
    status: "pending",
    retryCount: 0,
    createdAt: now,
  };

  await db.outbox.put(outboxEvent);
}

/**
 * Void sale transaction locally and queue sale.void event for sync
 */
export async function voidSaleLocalFirst(
  transactionId: string,
  reason: string
): Promise<void> {
  if (!reason || !reason.trim()) {
    throw new Error("Alasan void transaksi wajib diisi.");
  }

  const now = new Date().toISOString();
  const nextSeq = await getNextOutboxSeq();

  const outboxEvent: LocalOutboxEvent = {
    id: crypto.randomUUID(),
    seq: nextSeq,
    type: "sale.void",
    idempotencyKey: `sale_void_${transactionId}`,
    occurredAt: now,
    payload: {
      transactionId,
      saleId: transactionId,
      reason: reason.trim(),
      voidedAt: now,
    },
    status: "pending",
    retryCount: 0,
    createdAt: now,
  };

  await db.transaction("rw", [db.transactions, db.outbox], async () => {
    const existing = await db.transactions.get(transactionId);
    if (existing) {
      await db.transactions.put({
        ...existing,
        status: "VOIDED",
      });
    }
    await db.outbox.put(outboxEvent);
  });
}
