import {
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconPrinter,
  IconReceipt,
  IconScale,
  IconUserCheck,
  IconShieldCheck,
  IconClock,
  IconPercentage,
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
import { type CashierAuditItem } from "../data/cashierAuditData";

interface CashierAuditDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashier: CashierAuditItem | null;
}

export function CashierAuditDetailDialog({
  open,
  onOpenChange,
  cashier,
}: CashierAuditDetailDialogProps) {
  if (!cashier) return null;

  const avgSalesPerShift =
    cashier.totalShifts > 0
      ? Math.round(cashier.totalSales / cashier.totalShifts)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    if (cashier.auditStatus === "NORMAL") {
      return (
        <Badge
          variant="outline"
          className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          <IconCheck className="size-3 mr-1" />
          Aman / Normal
        </Badge>
      );
    }
    if (cashier.auditStatus === "WARNING") {
      return (
        <Badge
          variant="outline"
          className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
        >
          <IconAlertTriangle className="size-3 mr-1" />
          Perlu Review
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
      >
        <IconAlertCircle className="size-3 mr-1" />
        Selisih Tinggi
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <IconUserCheck className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Rincian Audit Kasir
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  {cashier.cashierCode} • {cashier.role}
                </DialogDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Cashier Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Nama Petugas Kasir</p>
              <p className="text-sm font-semibold">{cashier.cashierName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Audit Terakhir</p>
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <IconClock className="size-3.5 text-muted-foreground" />
                <span>{cashier.lastAuditDate}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <IconPercentage className="size-3.5" />
                <span className="text-xs font-medium">Akurasi Kas</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {cashier.accuracyRate}%
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <IconReceipt className="size-3.5" />
                <span className="text-xs font-medium">Total Shift</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {cashier.totalShifts} Shift
              </p>
            </div>
          </div>

          {/* Rekonsiliasi Kas Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <IconScale className="size-4 text-primary" />
              <span>Rekonsiliasi Kas</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Kas Sistem Diharapkan</span>
                <span className="font-medium font-mono">
                  {formatIDR(cashier.cashExpected)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Kas Fisik Aktual</span>
                <span className="font-medium font-mono">
                  {formatIDR(cashier.cashActual)}
                </span>
              </div>
              <div className="flex justify-between py-1 font-semibold text-slate-900 dark:text-slate-100 pt-1">
                <span>Selisih Kas</span>
                <span
                  className={`font-mono text-sm ${
                    cashier.cashDifference < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : cashier.cashDifference > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {cashier.cashDifference > 0 ? "+" : ""}
                  {formatIDR(cashier.cashDifference)}
                  {cashier.cashDifference === 0 && " (Sesuai)"}
                </span>
              </div>
            </div>
          </div>

          {/* Kinerja & Integritas Operasional */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <IconShieldCheck className="size-4 text-primary" />
              <span>Integritas & Kinerja Transaksi</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Omzet Penjualan</span>
                <span className="font-medium font-mono">
                  {formatIDR(cashier.totalSales)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Transaksi Selesai</span>
                <span className="font-medium">
                  {cashier.totalTransactions} transaksi
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  Rata-rata Penjualan / Shift
                </span>
                <span className="font-medium font-mono">
                  {formatIDR(avgSalesPerShift)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Pembatalan Nota (Void)</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {cashier.voidCount}x ({formatIDR(cashier.voidAmount)})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Diskon Manual Diberikan</span>
                <span className="font-medium">
                  {cashier.discountCount}x ({formatIDR(cashier.discountAmount)})
                </span>
              </div>
            </div>
          </div>

          {/* Catatan Audit Pengawas */}
          {cashier.notes && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-semibold mb-0.5">
                Catatan Evaluasi / Pengawas:
              </p>
              <p>{cashier.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="bg-slate-50 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <IconPrinter className="size-4" />
            <span>Cetak Hasil Audit</span>
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
