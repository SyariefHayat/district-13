import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { District13Database } from "./db";
import { createSaleLocalFirst } from "./offline-sales";

describe("Offline Storage & Outbox (T-40, T-45, T-46)", () => {
  let testDb: District13Database;

  beforeEach(async () => {
    testDb = new District13Database();
    await testDb.open();
    await testDb.stock.clear();
    await testDb.transactions.clear();
    await testDb.outbox.clear();
    await testDb.settings.clear();
  });

  it("stores 3,000 sales without storage error (T-40 capacity test)", async () => {
    const res = await testDb.testStoreCapacity(3000);
    expect(res.count).toBe(3000);

    const txCount = await testDb.transactions.count();
    const outboxCount = await testDb.outbox.count();

    expect(txCount).toBe(3000);
    expect(outboxCount).toBe(3000);
  });

  it("rejects sale if local display stock is insufficient (T-45)", async () => {
    // Stock is 0 or uninitialized
    await expect(
      createSaleLocalFirst({
        items: [
          {
            productId: "prod-none",
            productName: "Kopi Susu",
            quantity: 2,
            unitPrice: "15000.00",
            subtotalAmount: "30000.00",
          },
        ],
        subtotalAmount: "30000.00",
        totalAmount: "30000.00",
        paymentMethod: "CASH",
        paidAmount: "50000.00",
        changeAmount: "20000.00",
        shiftId: "shift-1",
        userId: "cashier-1",
      })
    ).rejects.toThrow("STOCK_INSUFFICIENT");
  });

  it("saves sale to IndexedDB and enqueues outbox event when stock is sufficient (T-45)", async () => {
    // Seed initial stock in Dexie
    const { db } = await import("./db");
    await db.stock.put({ productId: "prod-1", displayStock: 10 });

    const result = await createSaleLocalFirst({
      items: [
        {
          productId: "prod-1",
          productName: "Espresso",
          quantity: 3,
          unitPrice: "12000.00",
          subtotalAmount: "36000.00",
        },
      ],
      subtotalAmount: "36000.00",
      totalAmount: "36000.00",
      paymentMethod: "CASH",
      paidAmount: "50000.00",
      changeAmount: "14000.00",
      shiftId: "shift-1",
      userId: "cashier-1",
    });

    expect(result.success).toBe(true);
    expect(result.transaction.transactionNumber).toBeDefined();

    // Check remaining stock
    const remainingStock = await db.stock.get("prod-1");
    expect(remainingStock?.displayStock).toBe(7);

    // Check outbox
    const queuedEvents = await db.outbox.toArray();
    expect(queuedEvents.length).toBeGreaterThan(0);
    const lastEvent = queuedEvents.find((e) => e.type === "sale.create");
    expect(lastEvent).toBeDefined();
    expect(lastEvent?.idempotencyKey).toBe(result.transaction.id);
  });
});
