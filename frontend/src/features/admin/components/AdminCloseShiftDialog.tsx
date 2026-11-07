import * as React from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconDoorExit,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatIDR, type AdminActiveShift } from "../data/adminData";

interface AdminCloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: AdminActiveShift | null;
  onConfirm: (
    shiftId: string,
    closingCash: number,
    notes?: string
  ) => Promise<boolean>;
}

export function AdminCloseShiftDialog({
  open,
  onOpenChange,
  shift,
  onConfirm,
}: AdminCloseShiftDialogProps) {
  const [closingCash, setClosingCash] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && shift) {
      setErrorMsg(null);
      setClosingCash(String(shift.expectedCash || 0));
      setNotes("");
    }
  }, [open, shift]);

  if (!shift) return null;

  const expectedCash = shift.expectedCash || 0;
  const actualCash = parseFloat(closingCash.replace(/[^0-9.]/g, "") || "0");
  const difference = actualCash - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash < 0 || isNaN(actualCash)) {
      setErrorMsg("Nominal kas akhir tidak valid");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    const success = await onConfirm(shift.id, actualCash, notes);
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <IconDoorExit className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Tutup Shift Kasir (Admin Override)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Rekonsiliasi uang fisik laci kasir dan selesaikan shift untuk{" "}
                {shift.cashierName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Shift Details Summary */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Kasir Bertugas
              </span>
              <span className="font-semibold text-foreground">
                {shift.cashierName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Modal Awal
              </span>
              <span className="font-medium text-foreground">
                {formatIDR(shift.openingCash)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Penjualan Tunai
              </span>
              <span className="font-medium text-foreground">
                {formatIDR(shift.cashSales)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Total Transaksi
              </span>
              <span className="font-medium text-foreground">
                {shift.transactionCount} transaksi
              </span>
            </div>
            <div className="col-span-2 border-t pt-2 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  Ekspektasi Kas Sistem:
                </span>
                <span className="text-sm font-bold text-primary font-mono">
                  {formatIDR(expectedCash)}
                </span>
              </div>
            </div>
          </div>

          {/* Actual Closing Cash Input */}
          <div className="space-y-1.5">
            <Label htmlFor="closing-cash-input" className="text-xs font-medium">
              Kas Aktual Fisik di Laci (Rp)
            </Label>
            <Input
              id="closing-cash-input"
              type="number"
              min="0"
              step="500"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="text-base font-bold font-mono"
              required
            />
          </div>

          {/* Difference Alert / Badge */}
          <div className="rounded-lg border p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Selisih Kas:</span>
              <div className="flex items-center gap-1.5 font-bold font-mono">
                {difference === 0 ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    <IconCheck className="size-3 mr-1 inline" />
                    Pas (Rp 0)
                  </Badge>
                ) : difference > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  >
                    Lebih: +{formatIDR(difference)}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <IconAlertTriangle className="size-3 mr-1 inline" />
                    Kurang: {formatIDR(difference)}
                  </Badge>
                )}
              </div>
            </div>
            {difference !== 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {difference < 0
                  ? "Terdapat kekurangan uang fisik di laci dibandingkan sistem."
                  : "Terdapat kelebihan uang fisik di laci dibandingkan sistem."}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="close-notes" className="text-xs font-medium">
              Catatan Penutupan Shift (Opsional)
            </Label>
            <Textarea
              id="close-notes"
              rows={2}
              placeholder="Contoh: Ditutup oleh Admin karena pergantian giliran kasir..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              className="text-xs"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-3.5 mr-1.5" />
                  Menutup Shift...
                </>
              ) : (
                "Konfirmasi Tutup Shift"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
