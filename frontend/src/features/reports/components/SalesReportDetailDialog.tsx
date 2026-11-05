import {
  IconCheck,
  IconClock,
  IconCreditCard,
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
  formatReportDate,
  type SalesReportItem,
} from "../data/salesReportData";

interface SalesReportDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: SalesReportItem | null;
}

export function SalesReportDetailDialog({
  open,
  onOpenChange,
  transaction,
}: SalesReportDetailDialogProps) {
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

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <IconClock className="size-3.5 text-slate-400 shrink-0" />
              <span>{formatReportDate(transaction.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconUser className="size-3.5 text-slate-400 shrink-0" />
              <span>Kasir: {transaction.cashierName || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconCreditCard className="size-3.5 text-slate-400 shrink-0" />
              <span>Metode: {transaction.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal (Penjualan Kotor)</span>
              <span>{formatIDR(transaction.subtotalAmount)}</span>
            </div>

            {transaction.discountAmount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>
                  Diskon{" "}
                  {transaction.discountReason
                    ? `(${transaction.discountReason})`
                    : ""}
                </span>
                <span>-{formatIDR(transaction.discountAmount)}</span>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-slate-100">
              <span>Total Bersih</span>
              <span className="text-primary">
                {formatIDR(transaction.totalAmount)}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Dibayar</span>
              <span>{formatIDR(transaction.paidAmount)}</span>
            </div>

            {transaction.changeAmount > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Kembalian</span>
                <span>{formatIDR(transaction.changeAmount)}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-slate-50 dark:bg-slate-900/40 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <IconPrinter className="size-4" />
            <span>Cetak Bukti</span>
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
