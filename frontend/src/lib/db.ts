import Dexie, { type Table } from "dexie";
import type { UserRole } from "../context/auth-context";

export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  costPrice?: string;
  unit: string;
  categoryId: string;
  subcategoryId?: string | null;
  brandId?: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface LocalCategory {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface LocalSubcategory {
  id: string;
  categoryId: string;
  name: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface LocalBrand {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface LocalAddon {
  id: string;
  name: string;
  price: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface LocalProductAddon {
  id?: string;
  productId: string;
  addonId: string;
}

export interface LocalDiscount {
  id: string;
  name: string;
  type: "nominal" | "percent";
  value: string;
  minPurchase?: string | null;
  maxDiscount?: string | null;
  scope: string;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt?: string;
}

export interface LocalSetting {
  key: string;
  value: any;
  updatedAt?: string;
}

export interface LocalStock {
  productId: string;
  displayStock: number;
  updatedAt?: string;
}

export interface LocalActiveShift {
  id: string;
  shiftId: string;
  userId: string;
  openedAt: string;
  startingCash: string;
  status: "OPEN" | "CLOSED";
}

export interface LocalTransaction {
  id: string;
  transactionNumber: string;
  shiftId: string;
  userId: string;
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
  discountAmount: string;
  discountReason?: string | null;
  totalAmount: string;
  paymentMethod: "CASH" | "QRIS";
  paidAmount: string;
  changeAmount: string;
  status: "COMPLETED" | "VOIDED";
  isOffline: boolean;
  createdAt: string;
}

export interface LocalOutboxEvent {
  id: string;
  seq: number;
  type:
    "shift.open" | "sale.create" | "sale.void" | "cash.record" | "shift.close";
  idempotencyKey: string;
  occurredAt: string;
  payload: Record<string, any>;
  status: "pending" | "syncing" | "synced" | "rejected";
  retryCount: number;
  createdAt: string;
  error?: string;
}

export interface LocalOfflineCredential {
  username: string;
  salt: string;
  verifier: string;
  iterations: number;
  role: UserRole;
  fullName?: string;
  isActive: boolean;
  lastSync: string;
}

export class District13Database extends Dexie {
  products!: Table<LocalProduct, string>;
  categories!: Table<LocalCategory, string>;
  subcategories!: Table<LocalSubcategory, string>;
  brands!: Table<LocalBrand, string>;
  addons!: Table<LocalAddon, string>;
  productAddons!: Table<LocalProductAddon, string>;
  discounts!: Table<LocalDiscount, string>;
  settings!: Table<LocalSetting, string>;
  stock!: Table<LocalStock, string>;
  activeShift!: Table<LocalActiveShift, string>;
  transactions!: Table<LocalTransaction, string>;
  outbox!: Table<LocalOutboxEvent, string>;
  offlineCredentials!: Table<LocalOfflineCredential, string>;

  constructor() {
    super("district13_pos_db");

    this.version(1).stores({
      products:
        "id, name, sku, barcode, categoryId, subcategoryId, brandId, price, isActive",
      categories: "id, name, isActive",
      subcategories: "id, categoryId, name, isActive",
      brands: "id, name, isActive",
      addons: "id, name, price, isActive",
      productAddons: "++id, [productId+addonId], productId, addonId",
      discounts: "id, name, type, isActive",
      settings: "key",
      stock: "productId, displayStock",
      activeShift: "id, shiftId, userId, status",
      transactions:
        "id, transactionNumber, shiftId, userId, status, isOffline, createdAt",
      outbox: "id, seq, type, idempotencyKey, occurredAt, status, createdAt",
      offlineCredentials: "username, role",
    });
  }

  /**
   * Capacity Test (AC for T-40): Test saving >= 3,000 sales without storage error
   */
  async testStoreCapacity(
    count: number = 3000
  ): Promise<{ count: number; durationMs: number }> {
    const startTime = Date.now();
    const batchSize = 500;
    const now = new Date().toISOString();

    for (let i = 0; i < count; i += batchSize) {
      const currentBatchSize = Math.min(batchSize, count - i);
      const testTransactions: LocalTransaction[] = [];
      const testEvents: LocalOutboxEvent[] = [];

      for (let j = 0; j < currentBatchSize; j++) {
        const index = i + j + 1;
        const id = `test-tx-${index}`;
        testTransactions.push({
          id,
          transactionNumber: `OFF-TEST-${index}`,
          shiftId: "test-shift-1",
          userId: "test-user-1",
          items: [
            {
              productId: "p1",
              productName: "Item",
              quantity: 1,
              unitPrice: "10000",
              subtotalAmount: "10000",
            },
          ],
          subtotalAmount: "10000.00",
          discountAmount: "0.00",
          totalAmount: "10000.00",
          paymentMethod: "CASH",
          paidAmount: "10000.00",
          changeAmount: "0.00",
          status: "COMPLETED",
          isOffline: true,
          createdAt: now,
        });

        testEvents.push({
          id: `test-event-${index}`,
          seq: index,
          type: "sale.create",
          idempotencyKey: `idem-test-${index}`,
          occurredAt: now,
          payload: { transactionId: id },
          status: "pending",
          retryCount: 0,
          createdAt: now,
        });
      }

      await this.transaction(
        "rw",
        [this.transactions, this.outbox],
        async () => {
          await this.transactions.bulkPut(testTransactions);
          await this.outbox.bulkPut(testEvents);
        }
      );
    }

    const durationMs = Date.now() - startTime;
    return { count, durationMs };
  }
}

export const db = new District13Database();
