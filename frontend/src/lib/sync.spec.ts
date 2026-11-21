import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "./db";
import { syncCatalogFromServer } from "./sync-catalog";
import { syncOutbox } from "./outbox-sync";
import { connectivity } from "./connectivity";

describe("Catalog & Outbox Synchronization (T-41, T-46)", () => {
  beforeEach(async () => {
    connectivity.setOnlineStatus(true);
    await db.open();
    await db.products.clear();
    await db.stock.clear();
    await db.outbox.clear();
    await db.settings.clear();
    vi.restoreAllMocks();
  });

  it("syncCatalogFromServer adjusts local stock deducting unsynced outbox sales (T-41)", async () => {
    // 1. Enqueue an unsynced outbox sale of 2 units of prod-1
    await db.outbox.put({
      id: "event-1",
      seq: 1,
      type: "sale.create",
      idempotencyKey: "idem-1",
      occurredAt: new Date().toISOString(),
      payload: {
        items: [{ productId: "prod-1", quantity: 2 }],
      },
      status: "pending",
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });

    // 2. Mock server response returning server displayStock = 10 for prod-1
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            id: "prod-1",
            name: "Kopi Susu Gula Aren",
            sku: "KPG-01",
            price: "18000",
            categoryId: "cat-1",
            isActive: true,
          },
        ],
        categories: [{ id: "cat-1", name: "Coffee", isActive: true }],
        stock: [{ productId: "prod-1", displayStock: 10 }],
        cursor: "cursor-2026-11-21",
      }),
    } as any);

    const res = await syncCatalogFromServer();
    expect(res.success).toBe(true);

    // 3. Local display stock should be 10 - 2 = 8
    const stockInDb = await db.stock.get("prod-1");
    expect(stockInDb?.displayStock).toBe(8);

    // Products and cursor should be stored
    const productInDb = await db.products.get("prod-1");
    expect(productInDb?.name).toBe("Kopi Susu Gula Aren");
    const cursorSetting = await db.settings.get("catalog_sync_cursor");
    expect(cursorSetting?.value).toBe("cursor-2026-11-21");
  });

  it("syncOutbox clears accepted and duplicate events from outbox (T-46)", async () => {
    // Enqueue two events: seq 1 and seq 2
    await db.outbox.bulkPut([
      {
        id: "event-1",
        seq: 1,
        type: "shift.open",
        idempotencyKey: "idem-shift-1",
        occurredAt: new Date().toISOString(),
        payload: { startingCash: "50000" },
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "event-2",
        seq: 2,
        type: "sale.create",
        idempotencyKey: "idem-sale-2",
        occurredAt: new Date().toISOString(),
        payload: { items: [] },
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);

    // Mock server returning accepted for seq 1 and duplicate for seq 2 (CON-04: duplicate is treated as success)
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { seq: 1, status: "accepted" },
          { seq: 2, status: "duplicate" },
        ],
        server_time: new Date().toISOString(),
        clock_skew_seconds: 1,
      }),
    } as any);

    const syncRes = await syncOutbox();
    expect(syncRes.synced).toBe(2);

    // Both events should be removed from outbox
    const remaining = await db.outbox.count();
    expect(remaining).toBe(0);
  });
});
