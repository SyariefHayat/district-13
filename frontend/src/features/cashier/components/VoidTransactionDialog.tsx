import * as React from "react";
import { IconAlertTriangle, IconBan } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { formatIDR } from "../data/cashierData";
import type { CashierTransaction } from "../data/cashierData";

interface VoidTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: CashierTransaction | null;
  onConfirmVoid: (transactionId: string, reason: string) => Promise<boolean>;
}

const VOID_REASON_PRESETS = [
  "Salah input pesanan oleh kasir",
  "Pelanggan membatalkan pesanan",
  "Transaksi ganda (duplikat)",
  "Kendala metode pembayaran",
];

export function VoidTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onConfirmVoid,
}: VoidTransactionDialogProps) {
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Alasan pembatalan (void) wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const success = await onConfirmVoid(transaction.id, reason.trim());
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
              <IconBan className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Pembatalan (Void) Transaksi
              </DialogTitle>
              <DialogDescription className="text-xs">
                Transaksi yang di-void akan dibatalkan statusnya dan stok
                dikembalikan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Target Transaction Info */}
          <div className="rounded-xl border bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nomor Transaksi:</span>
              <span className="font-mono font-bold text-foreground">
                {transaction.transactionNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Transaksi:</span>
              <span className="font-bold text-destructive">
                {formatIDR(transaction.totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Metode Bayar:</span>
              <span className="font-medium">{transaction.paymentMethod}</span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="void-reason" className="text-xs font-semibold">
              Alasan Pembatalan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Jelaskan alasan pembatalan transaksi secara detail..."
              rows={3}
              className="resize-none text-xs"
              autoFocus
              required
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-muted-foreground">
              Pilihan Alasan Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VOID_REASON_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReason(preset)}
                  className={`text-[11px] min-h-[36px] px-2.5 ${
                    reason === preset ? "border-primary bg-primary/10" : ""
                  }`}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Warning Banner */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive flex items-start gap-2">
            <IconAlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>
              Tindakan ini tidak dapat dibatalkan. Riwayat pembatalan akan
              tercatat dalam log audit shift kasir.
            </span>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}

          <DialogFooter className="mt-2 flex-row items-center justify-end gap-2">
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
              disabled={isSubmitting || !reason.trim()}
              className="min-h-[44px] gap-2 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  <span>Membatalkan...</span>
                </>
              ) : (
                <>
                  <IconBan className="size-4" />
                  <span>Konfirmasi Void</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
