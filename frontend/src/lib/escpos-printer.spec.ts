import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateEscPosReceipt,
  chunkBuffer,
  formatTwoColumns,
  formatCenter,
  mapPosTransactionToReceipt,
  mapSaleTransactionToReceipt,
  bluetoothPrinterService,
  type ReceiptPrintData,
  ESC_POS,
} from "./escpos-printer";
import type { PosCompletedTransaction } from "../features/pos/types/posTypes";
import type { SaleTransaction } from "../features/sales/data/salesData";

describe("ESC/POS 58mm Thermal Printer Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Formatting Utilities (58mm / 32 Columns)", () => {
    it("formats two columns correctly within 32 chars", () => {
      const line = formatTwoColumns("Subtotal", "Rp 50.000", 32);
      expect(line.length).toBe(32);
      expect(line.startsWith("Subtotal")).toBe(true);
      expect(line.endsWith("Rp 50.000")).toBe(true);
    });

    it("handles overflowing left column by wrapping right column to second line", () => {
      const longName = "2x Caramel Macchiato Double Espresso";
      const price = "Rp 76.000";
      const line = formatTwoColumns(longName, price, 32);

      const parts = line.split("\n");
      expect(parts.length).toBe(2);
      expect(parts[0]).toBe(longName);
      expect(parts[1].endsWith(price)).toBe(true);
      expect(parts[1].length).toBe(32);
    });

    it("centers text within 32 columns", () => {
      const text = "DISTRICT 13";
      const centered = formatCenter(text, 32);
      expect(centered.trim()).toBe("DISTRICT 13");
      const leftPad = centered.indexOf("DISTRICT");
      expect(leftPad).toBe(Math.floor((32 - text.length) / 2));
    });
  });

  describe("Binary ESC/POS Receipt Generation", () => {
    const mockPrintData: ReceiptPrintData = {
      storeName: "DISTRICT 13 CAFE",
      storeAddress: "Jl. Boulevard No. 13",
      storePhone: "0812-3456-7890",
      receiptFooter: "Terima Kasih!\nDatang Kembali",
      transactionNumber: "TRX-20261121-001",
      date: new Date("2026-11-21T14:30:00Z"),
      cashierName: "Ahmad",
      paymentMethod: "CASH",
      shiftId: "shift-uuid-12345678",
      items: [
        {
          name: "Kopi Susu Aren",
          quantity: 2,
          unitPrice: 20000,
          subtotalPrice: 40000,
          addons: [
            {
              name: "Extra Shot",
              price: 5000,
              quantity: 2,
            },
          ],
          notes: "Less ice",
        },
      ],
      subtotalAmount: 50000,
      discountAmount: 5000,
      discountReason: "Promo Member 10%",
      taxAmount: 4500,
      totalAmount: 49500,
      paidAmount: 50000,
      changeAmount: 500,
    };

    it("generates a non-empty Uint8Array binary payload", () => {
      const bytes = generateEscPosReceipt(mockPrintData);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(100);
    });

    it("starts with ESC/POS INIT command (0x1B, 0x40)", () => {
      const bytes = generateEscPosReceipt(mockPrintData);
      expect(bytes[0]).toBe(0x1b);
      expect(bytes[1]).toBe(0x40);
    });

    it("ends with partial cut command (0x1D, 0x56, 0x01)", () => {
      const bytes = generateEscPosReceipt(mockPrintData);
      const len = bytes.length;
      expect(bytes[len - 3]).toBe(0x1d);
      expect(bytes[len - 2]).toBe(0x56);
      expect(bytes[len - 1]).toBe(0x01);
    });

    it("encodes required text fields into binary", () => {
      const bytes = generateEscPosReceipt(mockPrintData);
      const text = new TextDecoder().decode(bytes);

      // Store Header
      expect(text).toContain("DISTRICT 13 CAFE");
      expect(text).toContain("Jl. Boulevard No. 13");
      expect(text).toContain("Telp: 0812-3456-7890");

      // Metadata
      expect(text).toContain("TRX-20261121-001");
      expect(text).toContain("Ahmad");
      expect(text).toContain("CASH");

      // Items & Addons
      expect(text).toContain("2x Kopi Susu Aren");
      expect(text).toContain("+ Extra Shot");
      expect(text).toContain("Note: Less ice");

      // Financials
      expect(text).toContain("TOTAL TAGIHAN");
      expect(text).toContain("Promo Member 10%");
      expect(text).toContain("Bayar Tunai");
      expect(text).toContain("Kembalian");

      // Footer
      expect(text).toContain("Terima Kasih!");
      expect(text).toContain("Datang Kembali");
    });
  });

  describe("BLE Packet Chunking (MTU Safe Pacing)", () => {
    it("chunks 65 bytes into four 20-byte packets (20, 20, 20, 5)", () => {
      const buffer = new Uint8Array(65);
      for (let i = 0; i < 65; i++) buffer[i] = i;

      const chunks = chunkBuffer(buffer, 20);
      expect(chunks.length).toBe(4);
      expect(chunks[0].length).toBe(20);
      expect(chunks[1].length).toBe(20);
      expect(chunks[2].length).toBe(20);
      expect(chunks[3].length).toBe(5);

      // Verify data integrity
      expect(chunks[0][0]).toBe(0);
      expect(chunks[0][19]).toBe(19);
      expect(chunks[3][4]).toBe(64);
    });

    it("handles buffer smaller than chunk size", () => {
      const buffer = new Uint8Array([1, 2, 3]);
      const chunks = chunkBuffer(buffer, 20);
      expect(chunks.length).toBe(1);
      expect(chunks[0].length).toBe(3);
    });
  });

  describe("Transaction Adapters", () => {
    it("maps PosCompletedTransaction to ReceiptPrintData", () => {
      const posTx: PosCompletedTransaction = {
        id: "tx-pos-1",
        transactionNumber: "TRX-POS-001",
        shiftId: "shift-001",
        cashierName: "Budi",
        createdAt: "2026-11-21T10:00:00Z",
        items: [
          {
            productId: "prod-1",
            productName: "Espresso",
            quantity: 1,
            unitPrice: 15000,
            subtotalPrice: 15000,
          },
        ],
        subtotalAmount: 15000,
        discountAmount: 0,
        totalAmount: 15000,
        paidAmount: 20000,
        changeAmount: 5000,
        paymentMethod: "CASH",
      };

      const receipt = mapPosTransactionToReceipt(posTx);
      expect(receipt.transactionNumber).toBe("TRX-POS-001");
      expect(receipt.cashierName).toBe("Budi");
      expect(receipt.items[0].name).toBe("Espresso");
      expect(receipt.totalAmount).toBe(15000);
      expect(receipt.changeAmount).toBe(5000);
    });

    it("maps SaleTransaction to ReceiptPrintData for reprint", () => {
      const saleTx: SaleTransaction = {
        id: "sale-1",
        transactionNumber: "TRX-SALE-002",
        shiftId: "shift-002",
        userId: "user-1",
        cashierName: "Siti",
        subtotalAmount: 30000,
        discountAmount: 3000,
        discountReason: "Diskon 10%",
        totalAmount: 27000,
        paymentMethod: "QRIS",
        paidAmount: 27000,
        changeAmount: 0,
        status: "COMPLETED",
        createdAt: "2026-11-21T11:00:00Z",
        items: [
          {
            id: "item-1",
            productId: "prod-2",
            productName: "Latte",
            quantity: 1,
            unitPrice: 30000,
            subtotalAmount: 30000,
          },
        ],
      };

      const receipt = mapSaleTransactionToReceipt(saleTx);
      expect(receipt.transactionNumber).toBe("TRX-SALE-002");
      expect(receipt.paymentMethod).toBe("QRIS");
      expect(receipt.discountReason).toBe("Diskon 10%");
      expect(receipt.items[0].name).toBe("Latte");
    });
  });

  describe("Fault Tolerance & Non-blocking Print Operation", () => {
    it("returns error result without throwing when Web Bluetooth is unsupported or disconnected", async () => {
      const result = await bluetoothPrinterService.printReceipt({
        transactionNumber: "TRX-ERR-001",
        date: new Date(),
        cashierName: "Kasir",
        paymentMethod: "CASH",
        items: [],
        subtotalAmount: 10000,
        totalAmount: 10000,
        paidAmount: 10000,
        changeAmount: 0,
      });

      // Crucial: Must return gracefully with success=false, NEVER throwing uncaught error
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
    });
  });
});
