import { useRef } from "react";
import { IconCheck, IconPrinter, IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "@/features/product/data/productData";
import { formatSaleDate } from "@/features/sales/data/salesData";
import type { PosCompletedTransaction } from "../types/posTypes";

interface PosReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: PosCompletedTransaction | null;
  onStartNewTransaction: () => void;
}

export function PosReceiptModal({
  open,
  onOpenChange,
  transaction,
  onStartNewTransaction,
}: PosReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden sm:max-h-[90vh] flex flex-col">
        {/* Success Header Banner */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <IconCheck className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                Transaksi Berhasil!
              </DialogTitle>
              <DialogDescription className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                {transaction.transactionNumber}
              </DialogDescription>
            </div>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] px-2.5 py-0.5">
            LUNAS
          </Badge>
        </div>

        {/* Digital Printable Receipt Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-card">
          <div
            ref={receiptRef}
            className="p-5 rounded-xl border border-dashed border-border bg-muted/20 font-mono text-xs flex flex-col gap-3 shadow-2xs print:border-none print:p-0 print:bg-white print:text-black"
          >
            {/* Store Branding */}
            <div className="text-center flex flex-col items-center gap-0.5">
              <h3 className="font-bold text-sm tracking-wider uppercase text-foreground print:text-black">
                DISTRICT 13 CAFE & WARKOP
              </h3>
              <p className="text-[10px] text-muted-foreground print:text-gray-600">
                Jl. Boulevard No. 13 · District 13 POS
              </p>
              <p className="text-[10px] text-muted-foreground print:text-gray-600">
                Telp: 0812-3456-7890
              </p>
            </div>

            <Separator className="border-dashed" />

            {/* Meta Information */}
            <div className="flex flex-col gap-1 text-[11px] text-muted-foreground print:text-gray-700">
              <div className="flex justify-between">
                <span>No. Transaksi:</span>
                <span className="font-bold text-foreground print:text-black">
                  {transaction.transactionNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal & Waktu:</span>
                <span>{formatSaleDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-semibold text-foreground print:text-black">
                  {transaction.paymentMethod}
                </span>
              </div>
            </div>

            <Separator className="border-dashed" />

            {/* Itemized Table */}
            <div className="flex flex-col gap-2 py-1">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex justify-between font-medium text-foreground print:text-black">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.productName}
                    </span>
                    <span>{formatIDR(item.subtotalPrice)}</span>
                  </div>

                  {/* Addons List */}
                  {item.addons && item.addons.length > 0 && (
                    <div className="pl-3 text-[10px] text-muted-foreground print:text-gray-600">
                      {item.addons.map((a) => (
                        <div key={a.id} className="flex justify-between">
                          <span>+ {a.name}</span>
                          <span>{formatIDR(a.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="pl-3 text-[10px] italic text-amber-600 dark:text-amber-400 print:text-gray-600">
                      Note: &ldquo;{item.notes}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Separator className="border-dashed" />

            {/* Total Calculations */}
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-muted-foreground print:text-gray-700">
                <span>Subtotal</span>
                <span>{formatIDR(transaction.subtotalAmount)}</span>
              </div>

              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 print:text-gray-800 font-medium">
                  <span>
                    Diskon{" "}
                    {transaction.discountReason
                      ? `(${transaction.discountReason})`
                      : ""}
                  </span>
                  <span>-{formatIDR(transaction.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-foreground print:text-black text-sm pt-1 border-t border-dashed">
                <span>TOTAL TAGIHAN</span>
                <span className="font-black text-primary print:text-black">
                  {formatIDR(transaction.totalAmount)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground print:text-gray-700 pt-1">
                <span>
                  {transaction.paymentMethod === "CASH"
                    ? "Tunai Diterima"
                    : "Jumlah QRIS"}
                </span>
                <span>{formatIDR(transaction.paidAmount)}</span>
              </div>

              {transaction.paymentMethod === "CASH" && (
                <div className="flex justify-between font-bold text-foreground print:text-black">
                  <span>Kembalian</span>
                  <span>{formatIDR(transaction.changeAmount)}</span>
                </div>
              )}
            </div>

            <Separator className="border-dashed" />

            {/* Receipt Footer */}
            <div className="text-center text-[10px] text-muted-foreground print:text-gray-600 flex flex-col gap-0.5 pt-1">
              <p className="font-semibold">Terima Kasih Atas Kunjungan Anda!</p>
              <p>
                Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.
              </p>
              <p className="font-mono text-[9px] mt-1">
                ID Shift: {transaction.shiftId.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t flex-row items-center justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs h-9"
          >
            <IconPrinter className="size-4 text-muted-foreground" />
            <span>Cetak Struk</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onStartNewTransaction}
            className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <IconPlus className="size-4" />
            <span>Transaksi Baru</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
