import * as React from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconDoorExit,
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

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedCash: number;
  openingCash: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  transactionCount: number;
  onConfirm: (closingCash: string) => Promise<boolean>;
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
  onConfirm,
}: CloseShiftDialogProps) {
  const [closingCash, setClosingCash] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setClosingCash(expectedCash.toString());
    }
  }, [open, expectedCash]);

  const numericClosing = parseFloat(closingCash.replace(/[^0-9.]/g, "") || "0");
  const difference = numericClosing - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const success = await onConfirm(closingCash);
    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
              <IconDoorExit className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Tutup Shift Kasir
              </DialogTitle>
              <DialogDescription className="text-xs">
                Rekonsiliasi uang fisik di laci dengan pencatatan sistem sebelum
                mengakhiri shift.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          {/* Summary Breakdown Card */}
          <div className="rounded-xl border bg-muted/30 p-3.5 text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b">
              <span>Ringkasan Kas Sistem</span>
              <span className="text-muted-foreground font-normal">
                {transactionCount} Transaksi
              </span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground">
              <span>Modal Awal Kas:</span>
              <span className="font-medium text-foreground">
                {formatIDR(openingCash)}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Penjualan Tunai:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +{formatIDR(cashSales)}
              </span>
            </div>
            {cashIn > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Kas Masuk Tambahan:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{formatIDR(cashIn)}
                </span>
              </div>
            )}
            {cashOut > 0 && (
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Kas Keluar:</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  -{formatIDR(cashOut)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t flex justify-between items-center text-sm font-semibold text-foreground">
              <span>Total Kas Diharapkan (Sistem):</span>
              <span className="text-primary text-base">
                {formatIDR(expectedCash)}
              </span>
            </div>
          </div>

          {/* Actual Cash Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="closing-cash" className="text-sm font-medium">
              Uang Fisik Kasir (Hasil Hitung Aktual)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
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
                className="pl-10 text-base font-semibold"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Difference Indicator */}
          <div className="rounded-lg border p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                <p className="text-xs font-medium text-muted-foreground">
                  Selisih Kas
                </p>
                <p className="text-sm font-semibold">
                  {difference === 0
                    ? "Uang Pas (Cocok)"
                    : difference > 0
                      ? `Lebih: ${formatIDR(difference)}`
                      : `Kurang: ${formatIDR(Math.abs(difference))}`}
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
              className={
                difference === 0
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                  : ""
              }
            >
              {difference === 0
                ? "Sesuai"
                : difference > 0
                  ? "Surplus"
                  : "Defisit"}
            </Badge>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || numericClosing < 0}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Menutup Shift...
                </>
              ) : (
                "Tutup Shift & Finalisasi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
