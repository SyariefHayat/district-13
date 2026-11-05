import {
  IconCheck,
  IconClock,
  IconPrinter,
  IconReceipt,
  IconScale,
  IconUser,
  IconWallet,
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
import { formatIDR } from "../data/salesReportData";
import { formatShiftDate, type ShiftReportItem } from "../data/shiftReportData";

interface ShiftReportDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftReportItem | null;
}

export function ShiftReportDetailDialog({
  open,
  onOpenChange,
  shift,
}: ShiftReportDetailDialogProps) {
  if (!shift) return null;

  const isOpen = shift.status === "OPEN";
  const diff = shift.cashDifference ?? 0;
  const isBalanced = diff === 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <IconClock className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Rincian Laporan Shift
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Kasir: {shift.cashierName || shift.username}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant={isOpen ? "default" : "outline"}
              className={`gap-1 px-2.5 py-0.5 ${
                isOpen
                  ? "bg-emerald-600 hover:bg-emerald-600/90 text-white"
                  : "border-slate-200 text-slate-600 dark:text-slate-300"
              }`}
            >
              {isOpen ? (
                <>
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                  <span>Sedang Berjalan</span>
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
              <IconUser className="size-3.5 text-slate-400 shrink-0" />
              <span>Username: @{shift.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconReceipt className="size-3.5 text-slate-400 shrink-0" />
              <span>{shift.transactionCount} Transaksi diproses</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <IconClock className="size-3.5 text-slate-400 shrink-0" />
              <span>
                Buka: {formatShiftDate(shift.openedAt)}
                {shift.closedAt
                  ? ` • Tutup: ${formatShiftDate(shift.closedAt)}`
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <IconWallet className="size-4 text-slate-400" />
                <span>Modal Awal (Kas Pembuka)</span>
              </span>
              <span className="font-medium text-foreground">
                {formatIDR(shift.openingCash)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <IconReceipt className="size-4 text-slate-400" />
                <span>Kas Diharapkan (Sistem)</span>
              </span>
              <span className="font-medium text-foreground">
                {formatIDR(shift.expectedCash)}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-slate-100">
              <span>Kas Akhir Fisik</span>
              <span className="text-primary font-bold">
                {shift.closingCash !== null
                  ? formatIDR(shift.closingCash)
                  : "Belum ditutup"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <IconScale className="size-3.5 text-slate-400" />
                <span>Status Selisih Kas</span>
              </span>
              {isOpen ? (
                <span className="text-muted-foreground">-</span>
              ) : isBalanced ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Rp 0 (Kas Seimbang)
                </span>
              ) : diff > 0 ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatIDR(diff)} (Surplus)
                </span>
              ) : (
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatIDR(diff)} (Kurang)
                </span>
              )}
            </div>
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
