import { db, type LocalTransaction, type LocalOutboxEvent } from "./db";
import { connectivity } from "./connectivity";

export interface CreateSaleInput {
  id?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotalAmount: string;
    addons?: Array<{ addonId: string; name: string; price: string }>;
  }>;
  subtotalAmount: string;
  discountId?: string | null;
  discountAmount?: string;
  discountReason?: string | null;
  totalAmount: string;
  paymentMethod: "CASH" | "QRIS";
  paidAmount: string;
  changeAmount: string;
  shiftId: string;
  userId: string;
  deviceCode?: string;
}

export interface SaleExecutionResult {
  success: boolean;
  transaction: LocalTransaction;
  isOffline: boolean;
  syncedImmediately: boolean;
  error?: string;
}

/**
 * Creates and saves sale local-first with strict IndexedDB durability (T-45, OFF-003, OFF-007)
 */
export async function createSaleLocalFirst(
  input: CreateSaleInput
): Promise<SaleExecutionResult> {
  const transactionId = input.id || crypto.randomUUID();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const deviceCode = input.deviceCode || "T1";

  // 1. Check local stock and compute new balances
  for (const item of input.items) {
    const stockRow = await db.stock.get(item.productId);
    const available = stockRow?.displayStock ?? 0;
    if (available < item.quantity || available <= 0) {
      throw new Error(
        `STOCK_INSUFFICIENT: Stok display untuk produk ${item.productName} tidak mencukupi (Tersedia: ${available}, Diminta: ${item.quantity})`
      );
    }
  }

  // 2. Compute sequence counter for receipt number
  const counterSetting = await db.settings.get(
    `counter_${deviceCode}_${dateStr}`
  );
  const currentSeq = (counterSetting?.value as number) || 0;
  const nextSeq = currentSeq + 1;
  const receiptNo = `${deviceCode}-${dateStr}-${String(nextSeq).padStart(4, "0")}`;

  const transactionRecord: LocalTransaction = {
    id: transactionId,
    transactionNumber: receiptNo,
    shiftId: input.shiftId,
    userId: input.userId,
    items: input.items,
    subtotalAmount: input.subtotalAmount,
    discountId: input.discountId,
    discountAmount: input.discountAmount || "0.00",
    discountReason: input.discountReason,
    totalAmount: input.totalAmount,
    paymentMethod: input.paymentMethod,
    paidAmount: input.paidAmount,
    changeAmount: input.changeAmount,
    status: "COMPLETED",
    isOffline: connectivity.isOffline,
    createdAt: now.toISOString(),
  };

  const outboxEvent: LocalOutboxEvent = {
    id: crypto.randomUUID(),
    seq: nextSeq,
    type: "sale.create",
    idempotencyKey: transactionId,
    occurredAt: now.toISOString(),
    payload: {
      id: transactionId,
      receiptNo,
      transactionNumber: receiptNo,
      shiftId: input.shiftId,
      userId: input.userId,
      items: input.items,
      subtotalAmount: input.subtotalAmount,
      discountId: input.discountId,
      discountAmount: input.discountAmount || "0.00",
      discountReason: input.discountReason,
      totalAmount: input.totalAmount,
      paymentMethod: input.paymentMethod,
      paidAmount: input.paidAmount,
      changeAmount: input.changeAmount,
      createdAt: now.toISOString(),
    },
    status: "pending",
    retryCount: 0,
    createdAt: now.toISOString(),
  };

  // 3. Atomically write transaction, update stock, save counter and outbox event
  await db.transaction(
    "rw",
    [db.transactions, db.stock, db.settings, db.outbox],
    async () => {
      // Deduct stock
      for (const item of input.items) {
        const current = await db.stock.get(item.productId);
        const remaining = Math.max(
          0,
          (current?.displayStock ?? 0) - item.quantity
        );
        await db.stock.put({
          productId: item.productId,
          displayStock: remaining,
          updatedAt: now.toISOString(),
        });
      }

      // Save counter
      await db.settings.put({
        key: `counter_${deviceCode}_${dateStr}`,
        value: nextSeq,
        updatedAt: now.toISOString(),
      });

      // Save transaction
      await db.transactions.put(transactionRecord);

      // Save outbox event
      await db.outbox.put(outboxEvent);
    }
  );

  return {
    success: true,
    transaction: transactionRecord,
    isOffline: connectivity.isOffline,
    syncedImmediately: false,
  };
}
