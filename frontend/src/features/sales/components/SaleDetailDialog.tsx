import {
  IconCheck,
  IconClock,
  IconPrinter,
  IconReceipt,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  formatIDR,
  formatSaleDate,
  type SaleTransaction,
} from "../data/salesData";

interface SaleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: SaleTransaction | null;
  onVoidClick?: (transaction: SaleTransaction) => void;
}

export function SaleDetailDialog({
  open,
  onOpenChange,
  transaction,
  onVoidClick,
}: SaleDetailDialogProps) {
  if (!transaction) return null;

  const isVoided = transaction.status === "VOIDED";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Receipt Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <IconReceipt className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Rincian Transaksi
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  {transaction.transactionNumber}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant={isVoided ? "destructive" : "default"}
              className="gap-1 px-2.5 py-0.5"
            >
              {isVoided ? (
                <>
                  <IconX className="size-3" />
                  <span>Dibatalkan</span>
                </>
              ) : (
                <>
                  <IconCheck className="size-3" />
                  <span>Selesai</span>
                </>
              )}
            </Badge>
          </div>

          {/* Meta Info */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <IconClock className="size-3.5 text-slate-400" />
              <span>{formatSaleDate(transaction.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <IconUser className="size-3.5 text-slate-400" />
              <span>Kasir: {transaction.cashierName || "Petugas"}</span>
            </div>
          </div>

          {isVoided && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              <p className="font-semibold">Informasi Pembatalan (Void):</p>
              <p className="mt-0.5">
                Alasan: {transaction.voidReason || "Tidak ada keterangan"}
              </p>
              {transaction.voidedAt && (
                <p className="text-[11px] text-destructive/80 mt-0.5">
                  Waktu: {formatSaleDate(transaction.voidedAt)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Item List */}
        <div className="max-h-[300px] overflow-y-auto px-6 py-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Item Pesanan
          </p>

          {transaction.items && transaction.items.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transaction.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} x {formatIDR(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatIDR(item.subtotalAmount)}
                    </span>
                  </div>

                  {item.addons && item.addons.length > 0 && (
                    <div className="mt-1 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5">
                      {item.addons.map((ad, adIdx) => (
                        <div
                          key={ad.id || adIdx}
                          className="flex items-center justify-between text-xs text-slate-500"
                        >
                          <span>+ {ad.addonName}</span>
                          <span>
                            {formatIDR(ad.unitPrice * (ad.quantity || 1))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Tidak ada rincian item (transaksi langsung).
            </p>
          )}

          <Separator className="my-2" />

          {/* Totals Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{formatIDR(transaction.subtotalAmount)}</span>
            </div>

            {transaction.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>
                  Diskon{" "}
                  {transaction.discountReason
                    ? `(${transaction.discountReason})`
                    : ""}
                </span>
                <span>-{formatIDR(transaction.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Total Pembayaran</span>
              <span>{formatIDR(transaction.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-500 pt-1">
              <span>Metode Pembayaran</span>
              <span className="font-semibold">{transaction.paymentMethod}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Nominal Dibayar</span>
              <span>{formatIDR(transaction.paidAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Kembalian</span>
              <span>{formatIDR(transaction.changeAmount)}</span>
            </div>
          </div>
        </div>

        {/* Dialog Footer Actions */}
        <DialogFooter className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <div>
            {!isVoided && onVoidClick && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onVoidClick(transaction);
                }}
              >
                Void Transaksi
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <IconPrinter className="size-4" />
              <span>Cetak</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
