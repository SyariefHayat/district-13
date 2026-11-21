/**
 * ESC/POS 58mm Thermal Printer Engine & Web Bluetooth Driver
 *
 * Implements:
 * - 58 mm (32-column) ESC/POS binary receipt encoding (REQ: SAL-013, UC-POS-001 E5)
 * - BLE GATT service discovery, auto-reconnect, and MTU packet chunking (20-byte safe packets)
 * - Non-blocking execution: printer failure NEVER rolls back or blocks transactions
 * - Fast reprint from receipt modal and transaction history
 */

import { useState, useEffect, useCallback } from "react";
import type { PosCompletedTransaction } from "../features/pos/types/posTypes";
import type { SaleTransaction } from "../features/sales/data/salesData";

// ==========================================
// 1. Types & Interfaces
// ==========================================

export interface ReceiptItemAddon {
  id?: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface ReceiptItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotalPrice: number;
  addons?: ReceiptItemAddon[];
  notes?: string;
}

export interface ReceiptPrintData {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptFooter?: string;
  transactionNumber: string;
  date: Date | string | number;
  cashierName: string;
  paymentMethod: string;
  shiftId?: string;
  items: ReceiptItem[];
  subtotalAmount: number;
  discountAmount?: number;
  discountReason?: string;
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
}

export interface StoreReceiptConfig {
  storeName: string;
  storeAddress: string;
  receiptFooter: string;
  storePhone?: string;
}

export const DEFAULT_STORE_CONFIG: StoreReceiptConfig = {
  storeName: "DISTRICT 13 CAFE & WARKOP",
  storeAddress: "Jl. Boulevard No. 13 · District 13 POS",
  storePhone: "0812-3456-7890",
  receiptFooter:
    "Terima Kasih Atas Kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.",
};

// Common Bluetooth Low Energy Thermal Printer GATT Service UUIDs
export const BLE_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS printer service
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Common thermal POS BLE
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent UART (EPPOS EP-RPP02)
  "0000e0ff-0000-1000-8000-00805f9b34fb", // Vendor specific POS
  "0000ff00-0000-1000-8000-00805f9b34fb", // Generic Serial UART
  "0000fff0-0000-1000-8000-00805f9b34fb", // Generic Serial UART
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART Service (NUS)
];

// ==========================================
// 2. Binary ESC/POS Commands
// ==========================================

export const ESC_POS = {
  // Initialization
  INIT: new Uint8Array([0x1b, 0x40]),

  // Alignment
  ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([0x1b, 0x61, 0x02]),

  // Text Styling
  BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),
  DOUBLE_SIZE_ON: new Uint8Array([0x1d, 0x21, 0x11]), // Double height & width
  DOUBLE_HEIGHT_ON: new Uint8Array([0x1d, 0x21, 0x01]),
  NORMAL_SIZE: new Uint8Array([0x1d, 0x21, 0x00]),

  // Paper Handling
  FEED_3: new Uint8Array([0x1b, 0x64, 0x03]),
  FEED_5: new Uint8Array([0x1b, 0x64, 0x05]),
  PARTIAL_CUT: new Uint8Array([0x1d, 0x56, 0x01]), // GS V 1
  FULL_CUT: new Uint8Array([0x1d, 0x56, 0x00]), // GS V 0
  LINE_FEED: new Uint8Array([0x0a]),
};

// ==========================================
// 3. 58mm (32 Column) Layout Formatting Helpers
// ==========================================

const PRINTER_COLUMN_WIDTH = 32;

export function formatIDR(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `Rp ${rounded.toLocaleString("id-ID")}`;
}

export function formatTwoColumns(
  left: string,
  right: string,
  width = PRINTER_COLUMN_WIDTH
): string {
  if (left.length + right.length + 1 <= width) {
    const spaces = " ".repeat(width - left.length - right.length);
    return `${left}${spaces}${right}`;
  }
  // If line overflows, keep left and place right on next line aligned right
  const rightIndent = Math.max(0, width - right.length);
  return `${left}\n${" ".repeat(rightIndent)}${right}`;
}

export function formatCenter(
  text: string,
  width = PRINTER_COLUMN_WIDTH
): string {
  if (text.length >= width) return text.slice(0, width);
  const leftPad = Math.floor((width - text.length) / 2);
  return " ".repeat(leftPad) + text;
}

export function formatReceiptDate(dateVal: Date | string | number): string {
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return String(dateVal);
  }
}

// ==========================================
// 4. ESC/POS Binary Builder
// ==========================================

class EscPosBuilder {
  private buffers: Uint8Array[] = [];
  private encoder = new TextEncoder();

  addBytes(bytes: Uint8Array): this {
    this.buffers.push(bytes);
    return this;
  }

  addText(str: string): this {
    this.buffers.push(this.encoder.encode(str));
    return this;
  }

  addLine(str = ""): this {
    this.buffers.push(this.encoder.encode(str + "\n"));
    return this;
  }

  init(): this {
    return this.addBytes(ESC_POS.INIT);
  }

  alignCenter(): this {
    return this.addBytes(ESC_POS.ALIGN_CENTER);
  }

  alignLeft(): this {
    return this.addBytes(ESC_POS.ALIGN_LEFT);
  }

  alignRight(): this {
    return this.addBytes(ESC_POS.ALIGN_RIGHT);
  }

  bold(enable: boolean): this {
    return this.addBytes(enable ? ESC_POS.BOLD_ON : ESC_POS.BOLD_OFF);
  }

  doubleSize(enable: boolean): this {
    return this.addBytes(enable ? ESC_POS.DOUBLE_SIZE_ON : ESC_POS.NORMAL_SIZE);
  }

  separator(char = "-", width = PRINTER_COLUMN_WIDTH): this {
    return this.addLine(char.repeat(width));
  }

  feed(lines = 3): this {
    return this.addBytes(new Uint8Array([0x1b, 0x64, lines]));
  }

  cut(): this {
    return this.addBytes(ESC_POS.PARTIAL_CUT);
  }

  build(): Uint8Array {
    let totalLength = 0;
    for (const b of this.buffers) {
      totalLength += b.length;
    }
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const b of this.buffers) {
      combined.set(b, offset);
      offset += b.length;
    }
    return combined;
  }
}

// ==========================================
// 5. ESC/POS Receipt Generator (58 mm)
// ==========================================

export function generateEscPosReceipt(data: ReceiptPrintData): Uint8Array {
  const storeConfig = getCachedStoreConfig();
  const storeName = data.storeName || storeConfig.storeName;
  const storeAddress = data.storeAddress || storeConfig.storeAddress;
  const storePhone = data.storePhone || storeConfig.storePhone;
  const footerText = data.receiptFooter || storeConfig.receiptFooter;

  const builder = new EscPosBuilder();

  // 1. Initialize Printer
  builder.init();

  // 2. Store Header (Centered, Bold, Double Size)
  builder.alignCenter();
  builder.bold(true);
  builder.doubleSize(true);
  builder.addLine(storeName);
  builder.doubleSize(false);
  builder.bold(false);

  // Store Address & Phone
  if (storeAddress) {
    const addressLines = storeAddress.split("\n");
    for (const line of addressLines) {
      if (line.trim()) builder.addLine(line.trim());
    }
  }
  if (storePhone) {
    builder.addLine(`Telp: ${storePhone}`);
  }

  // Separator
  builder.separator("=");

  // 3. Metadata Section (Left Aligned)
  builder.alignLeft();
  builder.addLine(formatTwoColumns("No. Transaksi:", data.transactionNumber));
  builder.addLine(formatTwoColumns("Waktu:", formatReceiptDate(data.date)));
  builder.addLine(formatTwoColumns("Kasir:", data.cashierName));
  builder.addLine(formatTwoColumns("Metode Bayar:", data.paymentMethod));
  if (data.shiftId) {
    builder.addLine(
      formatTwoColumns("Shift ID:", `${data.shiftId.slice(0, 8)}...`)
    );
  }

  builder.separator("-");

  // 4. Line Items Table
  for (const item of data.items) {
    const itemLeft = `${item.quantity}x ${item.name}`;
    const itemRight = formatIDR(item.subtotalPrice);
    builder.addLine(formatTwoColumns(itemLeft, itemRight));

    // Addons
    if (item.addons && item.addons.length > 0) {
      for (const addon of item.addons) {
        const addonQty = addon.quantity ?? item.quantity;
        const addonTotal = addon.price * addonQty;
        const addonLeft = `  + ${addon.name}`;
        const addonRight = formatIDR(addonTotal);
        builder.addLine(formatTwoColumns(addonLeft, addonRight));
      }
    }

    // Notes
    if (item.notes && item.notes.trim()) {
      builder.addLine(`  Note: ${item.notes.trim()}`);
    }
  }

  builder.separator("-");

  // 5. Totals Breakdown
  builder.addLine(formatTwoColumns("Subtotal", formatIDR(data.subtotalAmount)));

  if (data.discountAmount && data.discountAmount > 0) {
    const discountLabel = data.discountReason
      ? `Diskon (${data.discountReason})`
      : "Diskon";
    builder.addLine(
      formatTwoColumns(discountLabel, `-${formatIDR(data.discountAmount)}`)
    );
  }

  if (data.taxAmount && data.taxAmount > 0) {
    builder.addLine(formatTwoColumns("Pajak", formatIDR(data.taxAmount)));
  }

  // TOTAL in Bold
  builder.bold(true);
  builder.addLine(
    formatTwoColumns("TOTAL TAGIHAN", formatIDR(data.totalAmount))
  );
  builder.bold(false);

  // Payment & Change
  const payLabel =
    data.paymentMethod === "CASH" ? "Bayar Tunai" : "Jumlah QRIS";
  builder.addLine(formatTwoColumns(payLabel, formatIDR(data.paidAmount)));

  if (data.paymentMethod === "CASH") {
    builder.addLine(
      formatTwoColumns("Kembalian", formatIDR(data.changeAmount))
    );
  }

  builder.separator("=");

  // 6. Footer Notes
  builder.alignCenter();
  if (footerText) {
    const footerLines = footerText.split("\n");
    for (const fLine of footerLines) {
      if (fLine.trim()) builder.addLine(fLine.trim());
    }
  }

  // 7. Paper Feed & Cut
  builder.feed(4);
  builder.cut();

  return builder.build();
}

// ==========================================
// 6. Packet Chunking (BLE MTU Safe Splitting)
// ==========================================

export function chunkBuffer(buffer: Uint8Array, chunkSize = 20): Uint8Array[] {
  if (chunkSize <= 0) chunkSize = 20;
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.subarray(i, i + chunkSize));
  }
  return chunks;
}

// ==========================================
// 7. Store Config Cache (Offline LocalStorage)
// ==========================================

const STORE_CONFIG_KEY = "district13_store_config";

export function getCachedStoreConfig(): StoreReceiptConfig {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORE_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          storeName: parsed.storeName || DEFAULT_STORE_CONFIG.storeName,
          storeAddress:
            parsed.storeAddress || DEFAULT_STORE_CONFIG.storeAddress,
          receiptFooter:
            parsed.receiptFooter || DEFAULT_STORE_CONFIG.receiptFooter,
          storePhone: parsed.storePhone || DEFAULT_STORE_CONFIG.storePhone,
        };
      }
    }
  } catch {
    // Return default on error
  }
  return DEFAULT_STORE_CONFIG;
}

export function saveCachedStoreConfig(
  config: Partial<StoreReceiptConfig>
): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const current = getCachedStoreConfig();
      const updated = { ...current, ...config };
      window.localStorage.setItem(STORE_CONFIG_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage failure
  }
}

// ==========================================
// 8. Adapters for POS and Sales Transactions
// ==========================================

export function mapPosTransactionToReceipt(
  tx: PosCompletedTransaction
): ReceiptPrintData {
  return {
    transactionNumber: tx.transactionNumber,
    date: tx.createdAt,
    cashierName: tx.cashierName,
    paymentMethod: tx.paymentMethod,
    shiftId: tx.shiftId,
    items: tx.items.map((it) => ({
      name: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotalPrice: it.subtotalPrice,
      addons: it.addons?.map((ad) => ({
        id: ad.id,
        name: ad.name,
        price: ad.price,
      })),
      notes: it.notes,
    })),
    subtotalAmount: tx.subtotalAmount,
    discountAmount: tx.discountAmount,
    discountReason: tx.discountReason,
    totalAmount: tx.totalAmount,
    paidAmount: tx.paidAmount,
    changeAmount: tx.changeAmount,
  };
}

export function mapSaleTransactionToReceipt(
  tx: SaleTransaction
): ReceiptPrintData {
  return {
    transactionNumber: tx.transactionNumber,
    date: tx.createdAt,
    cashierName: tx.cashierName || "Kasir",
    paymentMethod: tx.paymentMethod,
    shiftId: tx.shiftId,
    items: (tx.items || []).map((it) => ({
      name: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotalPrice: it.subtotalAmount,
      addons: it.addons?.map((ad) => ({
        id: ad.id,
        name: ad.addonName,
        price: ad.unitPrice,
        quantity: ad.quantity,
      })),
      notes: it.notes,
    })),
    subtotalAmount: tx.subtotalAmount,
    discountAmount: tx.discountAmount,
    discountReason: tx.discountReason || undefined,
    totalAmount: tx.totalAmount,
    paidAmount: tx.paidAmount,
    changeAmount: tx.changeAmount,
  };
}

// ==========================================
// 9. Web Bluetooth Driver & Service
// ==========================================

export type BluetoothStatus = "disconnected" | "connecting" | "connected";

type StatusListener = (
  status: BluetoothStatus,
  deviceName: string | null
) => void;

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;
  private status: BluetoothStatus = "disconnected";
  private deviceName: string | null = null;
  private listeners: Set<StatusListener> = new Set();

  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof (navigator as any).bluetooth !== "undefined"
    );
  }

  getStatus(): { status: BluetoothStatus; deviceName: string | null } {
    return { status: this.status, deviceName: this.deviceName };
  }

  addListener(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.deviceName);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.status, this.deviceName);
      } catch {
        // ignore listener errors
      }
    }
  }

  private setStatus(
    status: BluetoothStatus,
    name: string | null = this.deviceName
  ): void {
    this.status = status;
    this.deviceName = name;
    this.notify();
  }

  /**
   * Prompts user via browser native BLE dialog to pair a thermal printer.
   * MUST be triggered by a user gesture (e.g. button click).
   */
  async requestDevice(): Promise<{
    success: boolean;
    deviceName?: string;
    error?: string;
  }> {
    if (!this.isSupported()) {
      return {
        success: false,
        error:
          "Web Bluetooth API tidak didukung pada browser ini. Gunakan Chrome di Android/Desktop via HTTPS.",
      };
    }

    try {
      this.setStatus("connecting");

      const navBt = (navigator as any).bluetooth;
      const device = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINTER_SERVICES,
      });

      this.device = device;
      this.deviceName = device.name || "Thermal Printer";

      device.addEventListener("gattserverdisconnected", () => {
        this.characteristic = null;
        this.setStatus("disconnected");
      });

      const characteristic = await this.connectGatt(device);
      this.characteristic = characteristic;
      this.setStatus("connected", this.deviceName);

      // Cache device ID for future reconnect
      try {
        if (typeof window !== "undefined" && window.localStorage && device.id) {
          window.localStorage.setItem("district13_last_printer_id", device.id);
          window.localStorage.setItem(
            "district13_last_printer_name",
            this.deviceName || ""
          );
        }
      } catch {
        // Ignore storage errors
      }

      return { success: true, deviceName: this.deviceName || undefined };
    } catch (err: any) {
      this.setStatus("disconnected");
      if (err.name === "NotFoundError") {
        return {
          success: false,
          error: "Pemilihan printer Bluetooth dibatalkan.",
        };
      }
      return {
        success: false,
        error: err.message || "Gagal memasangkan printer Bluetooth.",
      };
    }
  }

  /**
   * Attempts reconnecting to a previously paired printer if supported by browser.
   */
  async reconnect(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const navBt = (navigator as any).bluetooth;

      // Check if current device can just be reconnected
      if (this.device && this.device.gatt) {
        if (this.device.gatt.connected && this.characteristic) {
          this.setStatus("connected", this.deviceName);
          return true;
        }
        this.setStatus("connecting");
        const char = await this.connectGatt(this.device);
        this.characteristic = char;
        this.setStatus("connected", this.deviceName);
        return true;
      }

      // Check navigator.bluetooth.getDevices() (Chrome 85+)
      if (typeof navBt.getDevices === "function") {
        const devices = await navBt.getDevices();
        if (devices && devices.length > 0) {
          let target = devices[0];
          const lastId =
            typeof window !== "undefined"
              ? window.localStorage?.getItem("district13_last_printer_id")
              : null;

          if (lastId) {
            const matched = devices.find((d: any) => d.id === lastId);
            if (matched) target = matched;
          }

          this.device = target;
          this.deviceName = target.name || "Thermal Printer";
          this.setStatus("connecting");

          target.addEventListener("gattserverdisconnected", () => {
            this.characteristic = null;
            this.setStatus("disconnected");
          });

          const char = await this.connectGatt(target);
          this.characteristic = char;
          this.setStatus("connected", this.deviceName);
          return true;
        }
      }

      return false;
    } catch {
      this.setStatus("disconnected");
      return false;
    }
  }

  /**
   * Connects to device GATT server and discovers writable characteristic.
   */
  private async connectGatt(device: any): Promise<any> {
    if (!device.gatt) {
      throw new Error("GATT server tidak tersedia pada perangkat.");
    }

    const server = await device.gatt.connect();

    // 1. Check known primary services
    for (const serviceUuid of BLE_PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      } catch {
        // Try next UUID
      }
    }

    // 2. Query all primary services fallback
    try {
      if (typeof server.getPrimaryServices === "function") {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const chars = await service.getCharacteristics();
            for (const char of chars) {
              if (
                char.properties.write ||
                char.properties.writeWithoutResponse
              ) {
                return char;
              }
            }
          } catch {
            // continue
          }
        }
      }
    } catch {
      // ignore
    }

    throw new Error(
      "Karakteristik tulis ESC/POS tidak ditemukan pada printer Bluetooth ini."
    );
  }

  disconnect(): void {
    try {
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
    } catch {
      // Ignore disconnect error
    } finally {
      this.characteristic = null;
      this.setStatus("disconnected");
    }
  }

  /**
   * Sends raw ESC/POS binary data in 20-byte chunks with pacing.
   * Completely fault-tolerant: never throws uncaught errors.
   */
  async printRaw(
    data: Uint8Array,
    chunkSize = 20,
    delayMs = 15
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.characteristic) {
        // Try quick reconnect
        const reconnected = await this.reconnect();
        if (!reconnected || !this.characteristic) {
          return {
            success: false,
            error:
              "Printer Bluetooth belum terhubung. Silakan pasangkan printer.",
          };
        }
      }

      const chunks = chunkBuffer(data, chunkSize);

      for (const chunk of chunks) {
        if (this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else if (this.characteristic.writeValue) {
          await this.characteristic.writeValue(chunk);
        }
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return { success: true };
    } catch (err: any) {
      console.warn("[ESC/POS Print Error]", err);
      return {
        success: false,
        error: err.message || "Gagal mengirim data cetak ke printer Bluetooth.",
      };
    }
  }

  /**
   * Generates and prints ESC/POS receipt for transaction data.
   */
  async printReceipt(
    data: ReceiptPrintData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const binary = generateEscPosReceipt(data);
      return await this.printRaw(binary);
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Gagal membuat format struk ESC/POS.",
      };
    }
  }
}

// Global Singleton Instance
export const bluetoothPrinterService = new BluetoothPrinterService();

// ==========================================
// 10. React Hook: useBluetoothPrinter
// ==========================================

export function useBluetoothPrinter() {
  const [status, setStatus] = useState<BluetoothStatus>(
    bluetoothPrinterService.getStatus().status
  );
  const [deviceName, setDeviceName] = useState<string | null>(
    bluetoothPrinterService.getStatus().deviceName
  );
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const unsubscribe = bluetoothPrinterService.addListener(
      (newStatus, name) => {
        setStatus(newStatus);
        setDeviceName(name);
      }
    );

    // Try auto-reconnect on mount if previously paired
    void bluetoothPrinterService.reconnect();

    return unsubscribe;
  }, []);

  const connect = useCallback(async () => {
    return await bluetoothPrinterService.requestDevice();
  }, []);

  const disconnect = useCallback(() => {
    bluetoothPrinterService.disconnect();
  }, []);

  const printReceipt = useCallback(async (data: ReceiptPrintData) => {
    setIsPrinting(true);
    try {
      return await bluetoothPrinterService.printReceipt(data);
    } finally {
      setIsPrinting(false);
    }
  }, []);

  return {
    isSupported: bluetoothPrinterService.isSupported(),
    status,
    deviceName,
    isPrinting,
    connect,
    disconnect,
    printReceipt,
  };
}
