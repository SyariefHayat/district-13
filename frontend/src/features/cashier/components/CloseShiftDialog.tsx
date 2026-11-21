import * as React from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconDoorExit,
  IconShoppingCart,
  IconCloudUpload,
  IconClock,
  IconCash,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatIDR } from "../data/cashierData";
import { hasActiveCart, getActiveCartTotalCount } from "@/lib/offline-shifts";
import { db } from "@/lib/db";

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedCash: number;
  openingCash: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  transactionCount: number;
  durationHours?: number;
  onConfirm: (
    closingCash: string,
    withdrawalAmount?: string
  ) => Promise<boolean>;
}

export function CloseShiftDialog({
  open,
  onOpenChange,
  expectedCash,
  openingCash,
  cashSales,
  cashIn,
  cashOut,
  transactionCount,
  durationHours = 0,
  onConfirm,
}: CloseShiftDialogProps) {
  const [closingCash, setClosingCash] = React.useState<string>("");
  const [withdrawalAmount, setWithdrawalAmount] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeCartCount, setActiveCartCount] = React.useState<number>(0);
  const [unsyncedCount, setUnsyncedCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (open) {
      setClosingCash(expectedCash.toString());
      setWithdrawalAmount(expectedCash.toString());
      setActiveCartCount(getActiveCartTotalCount());

      // Check unsynced outbox events
      db.outbox
        .where("status")
        .anyOf("pending", "syncing")
        .count()
        .then(setUnsyncedCount)
        .catch(() => setUnsyncedCount(0));
    }
  }, [open, expectedCash]);

  const numericClosing = parseFloat(closingCash.replace(/[^0-9.]/g, "") || "0");
  const numericWithdrawal = parseFloat(
    withdrawalAmount.replace(/[^0-9.]/g, "") || "0"
  );
  const difference = numericClosing - expectedCash;
  const remainingDrawerBalance = Math.max(
    0,
    numericClosing - numericWithdrawal
  );

  const cartIsActive = activeCartCount > 0 || hasActiveCart();
  const isShiftOver10h = durationHours >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cartIsActive) return;

    setIsSubmitting(true);
    const success = await onConfirm(closingCash, withdrawalAmount);
    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
              <IconDoorExit className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Tutup Shift Kasir (Rekonsiliasi Kas)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Selesaikan tahapan rekonsiliasi kas: uang sistem &rarr; uang
                fisik &rarr; selisih &rarr; penarikan setoran &rarr; kunci
                shift.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 1. REJECTION: Active Cart Warning */}
        {cartIsActive && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-destructive flex items-start gap-2.5 text-xs">
            <IconShoppingCart className="size-5 shrink-0 mt-0.5 text-destructive" />
            <div className="space-y-1">
              <p className="font-bold text-sm">
                Penutupan Shift Ditolak: Keranjang Aktif Ditemukan
              </p>
              <p>
                Terdapat <strong>{activeCartCount} item pesanan</strong> yang
                masih aktif di keranjang belanja Terminal POS. Anda harus
                menyelesaikan transaksi atau mengosongkan keranjang terlebih
                dahulu sebelum dapat menutup shift ini.
              </p>
            </div>
          </div>
        )}

        {/* 2. WARNING: Shift Duration > 10 Hours (SHF-012) */}
        {isShiftOver10h && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400 flex items-start gap-2 text-xs">
            <IconClock className="size-4 shrink-0 mt-0.5" />
            <span>
              <strong>Peringatan Durasi Shift (&gt; 10 Jam):</strong> Shift ini
              telah berjalan selama {durationHours} jam. Harap segera selesaikan
              penutupan shift untuk menjaga akurasi pembukuan harian.
            </span>
          </div>
        )}

        {/* 3. WARNING: Unsynced Sales in Outbox */}
        {unsyncedCount > 0 && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-blue-700 dark:text-blue-300 flex items-start gap-2 text-xs">
            <IconCloudUpload className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>Perhatian Transaksi Offline:</strong> Terdapat{" "}
              <strong>{unsyncedCount} data transaksi offline</strong> di antrean
              penyimpanan lokal. Data ini aman dan akan disinkronkan ke server
              secara otomatis setelah perangkat terhubung kembali.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          {/* Step 1: System Expected Cash Breakdown */}
          <div className="rounded-xl border bg-muted/30 p-3.5 text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b">
              <span>Langkah 1: Kas Diharapkan Sistem (Expected Cash)</span>
              <span className="text-muted-foreground font-normal">
                {transactionCount} Transaksi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Modal Awal Kas:</span>
                <span className="font-medium text-foreground">
                  {formatIDR(openingCash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Penjualan Tunai:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  +{formatIDR(cashSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kas Masuk Tambahan:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{formatIDR(cashIn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kas Keluar:</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  -{formatIDR(cashOut)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-sm font-bold text-foreground">
              <span>Total Kas Sistem Diharapkan:</span>
              <span className="text-primary text-base font-black">
                {formatIDR(expectedCash)}
              </span>
            </div>
          </div>

          {/* Step 2: Physical Cash Input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="closing-cash" className="text-xs font-semibold">
              Langkah 2: Hitung Fisik Uang Tunai di Laci Kasir (Physical Cash)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="closing-cash"
                type="number"
                min="0"
                step="500"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0"
                className="pl-10 text-base font-bold h-11"
                disabled={cartIsActive}
                required
              />
            </div>
          </div>

          {/* Step 3: Difference Indicator */}
          <div className="rounded-xl border p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {difference === 0 ? (
                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <IconCheck className="size-4" />
                </div>
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <IconAlertTriangle className="size-4" />
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Langkah 3: Selisih Rekonsiliasi Kas (Difference)
                </p>
                <p className="text-sm font-bold">
                  {difference === 0
                    ? "Uang Pas (Sesuai Sistem)"
                    : difference > 0
                      ? `Surplus Kas: +${formatIDR(difference)}`
                      : `Defisit Kas: -${formatIDR(Math.abs(difference))}`}
                </p>
              </div>
            </div>

            <Badge
              variant={
                difference === 0
                  ? "outline"
                  : difference > 0
                    ? "secondary"
                    : "destructive"
              }
              className={`text-xs px-2.5 py-0.5 ${
                difference === 0
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                  : ""
              }`}
            >
              {difference === 0
                ? "Sesuai (Match)"
                : difference > 0
                  ? "Lebih"
                  : "Kurang"}
            </Badge>
          </div>

          {/* Step 4: Cash Withdrawal (Penarikan Setoran Kasir) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="withdrawal-amount"
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <IconCash className="size-4 text-primary" />
                <span>Langkah 4: Penarikan Setoran Kas (Withdrawal)</span>
              </Label>
              <button
                type="button"
                onClick={() => setWithdrawalAmount(String(numericClosing))}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Tarik Semua Uang
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="withdrawal-amount"
                type="number"
                min="0"
                max={numericClosing}
                step="500"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="0"
                className="pl-10 text-base font-bold h-11"
                disabled={cartIsActive}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground px-1">
              <span>Sisa uang ditinggal di laci (modal shift berikutnya):</span>
              <span className="font-bold text-foreground">
                {formatIDR(remainingDrawerBalance)}
              </span>
            </div>
          </div>

          {/* Step 5: Final Lock Confirmation */}
          <DialogFooter className="mt-3 flex-row items-center justify-end gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || cartIsActive || numericClosing < 0}
              className="min-h-[44px] gap-2 font-bold px-5"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  <span>Menutup & Mengunci Shift...</span>
                </>
              ) : (
                <>
                  <IconDoorExit className="size-4" />
                  <span>Langkah 5: Kunci & Tutup Shift</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
