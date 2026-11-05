import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconClock,
  IconFileText,
  IconPrinter,
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
import { formatCashDate, type CashMovementItem } from "../data/cashReportData";

interface CashReportDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: CashMovementItem | null;
}

export function CashReportDetailDialog({
  open,
  onOpenChange,
  movement,
}: CashReportDetailDialogProps) {
  if (!movement) return null;

  const isCashIn = movement.type === "IN";

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
              <div
                className={`p-2 rounded-lg ${
                  isCashIn
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {isCashIn ? (
                  <IconArrowDownRight className="size-5" />
                ) : (
                  <IconArrowUpRight className="size-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Bukti Mutasi Kas
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  ID: {movement.id}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`gap-1 px-2.5 py-0.5 font-semibold ${
                isCashIn
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-red-500/40 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {isCashIn ? "Kas Masuk (IN)" : "Kas Keluar (OUT)"}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <IconUser className="size-3.5 text-slate-400 shrink-0" />
              <span>
                Petugas: {movement.recordedByName || movement.recordedBy}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconClock className="size-3.5 text-slate-400 shrink-0" />
              <span>{formatCashDate(movement.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="p-6 space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <IconFileText className="size-3.5" />
                <span>Keterangan / Keperluan:</span>
              </span>
              <p className="text-sm font-medium text-foreground">
                {movement.description}
              </p>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center text-base font-semibold text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5">
                <IconWallet className="size-4 text-slate-400" />
                <span>Nominal Mutasi</span>
              </span>
              <span
                className={`text-lg font-bold tabular-nums ${
                  isCashIn
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isCashIn ? "+" : "-"}
                {formatIDR(movement.amount)}
              </span>
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
