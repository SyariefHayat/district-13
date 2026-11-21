import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "./db";
import {
  hasActiveCart,
  setLocalActiveCart,
  clearLocalActiveCart,
  getActiveCartTotalCount,
  openShiftLocalFirst,
  closeShiftLocalFirst,
  createCashMovementLocalFirst,
  voidSaleLocalFirst,
} from "./offline-shifts";

describe("offline-shifts local durability and validation (T-49)", () => {
  beforeEach(async () => {
    await db.activeShift.clear();
    await db.transactions.clear();
    await db.outbox.clear();
    clearLocalActiveCart();
  });

  describe("active cart management", () => {
    it("reports hasActiveCart correctly", () => {
      expect(hasActiveCart()).toBe(false);
      expect(getActiveCartTotalCount()).toBe(0);

      setLocalActiveCart([
        {
          cartItemId: "item-1",
          productId: "p1",
          name: "Espresso",
          quantity: 2,
          unitPrice: 15000,
        },
      ]);

      expect(hasActiveCart()).toBe(true);
      expect(getActiveCartTotalCount()).toBe(2);

      clearLocalActiveCart();
      expect(hasActiveCart()).toBe(false);
      expect(getActiveCartTotalCount()).toBe(0);
    });
  });

  describe("openShiftLocalFirst", () => {
    it("opens shift locally and writes shift.open event to outbox", async () => {
      const shift = await openShiftLocalFirst("150000", "cashier-1");

      expect(shift.status).toBe("OPEN");
      expect(shift.startingCash).toBe("150000");
      expect(shift.userId).toBe("cashier-1");

      // Verify db.activeShift
      const local = await db.activeShift.get("current");
      expect(local).toBeDefined();
      expect(local?.shiftId).toBe(shift.shiftId);
      expect(local?.status).toBe("OPEN");

      // Verify db.outbox
      const events = await db.outbox
        .where("type")
        .equals("shift.open")
        .toArray();
      expect(events).toHaveLength(1);
      expect(events[0].payload.openingCash).toBe("150000");
      expect(events[0].payload.shiftId).toBe(shift.shiftId);
    });
  });

  describe("closeShiftLocalFirst", () => {
    it("rejects closing if active cart contains items", async () => {
      const shift = await openShiftLocalFirst("100000", "cashier-1");

      setLocalActiveCart([
        {
          cartItemId: "item-1",
          productId: "p1",
          name: "Kopi Susu",
          quantity: 1,
          unitPrice: 18000,
        },
      ]);

      await expect(
        closeShiftLocalFirst(shift.shiftId, "150000")
      ).rejects.toThrow("Tidak dapat menutup shift");

      // Verify shift remains OPEN
      const local = await db.activeShift.get("current");
      expect(local?.status).toBe("OPEN");
    });

    it("successfully closes shift when cart is empty and writes shift.close outbox event", async () => {
      const shift = await openShiftLocalFirst("100000", "cashier-1");

      clearLocalActiveCart();

      await closeShiftLocalFirst(shift.shiftId, "175000");

      const local = await db.activeShift.get("current");
      expect(local?.status).toBe("CLOSED");

      const events = await db.outbox
        .where("type")
        .equals("shift.close")
        .toArray();
      expect(events).toHaveLength(1);
      expect(events[0].payload.closingCash).toBe("175000");
      expect(events[0].payload.shiftId).toBe(shift.shiftId);
    });
  });

  describe("createCashMovementLocalFirst", () => {
    it("records cash in and out events in outbox", async () => {
      await createCashMovementLocalFirst(
        "shift-123",
        "IN",
        "50000",
        "Tambah uang pecahan kecil"
      );

      const events = await db.outbox
        .where("type")
        .equals("cash.record")
        .toArray();
      expect(events).toHaveLength(1);
      expect(events[0].payload.type).toBe("IN");
      expect(events[0].payload.amount).toBe("50000");
      expect(events[0].payload.description).toBe("Tambah uang pecahan kecil");
    });
  });

  describe("voidSaleLocalFirst", () => {
    it("rejects void without reason", async () => {
      await expect(voidSaleLocalFirst("tx-1", "")).rejects.toThrow(
        "Alasan void transaksi wajib diisi"
      );
    });

    it("marks local transaction as VOIDED and queues sale.void event", async () => {
      const txId = "tx-sample-1";
      await db.transactions.put({
        id: txId,
        transactionNumber: "TRX-001",
        shiftId: "shift-1",
        userId: "cashier-1",
        items: [],
        subtotalAmount: "25000.00",
        discountAmount: "0.00",
        totalAmount: "25000.00",
        paymentMethod: "CASH",
        paidAmount: "25000.00",
        changeAmount: "0.00",
        status: "COMPLETED",
        isOffline: false,
        createdAt: new Date().toISOString(),
      });

      await voidSaleLocalFirst(txId, "Salah input pesanan oleh kasir");

      // Verify db.transactions status
      const updatedTx = await db.transactions.get(txId);
      expect(updatedTx?.status).toBe("VOIDED");

      // Verify db.outbox
      const events = await db.outbox
        .where("type")
        .equals("sale.void")
        .toArray();
      expect(events).toHaveLength(1);
      expect(events[0].payload.transactionId).toBe(txId);
      expect(events[0].payload.reason).toBe("Salah input pesanan oleh kasir");
    });
  });
});
