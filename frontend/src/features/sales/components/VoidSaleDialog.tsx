import * as React from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatIDR, type SaleTransaction } from "../data/salesData";

interface VoidSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: SaleTransaction | null;
  onConfirm: (id: string, reason: string) => Promise<boolean>;
}

export function VoidSaleDialog({
  open,
  onOpenChange,
  transaction,
  onConfirm,
}: VoidSaleDialogProps) {
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Alasan pembatalan harus diisi.");
      return;
    }
    if (trimmed.length > 255) {
      setError("Alasan tidak boleh lebih dari 255 karakter.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const success = await onConfirm(transaction.id, trimmed);
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <IconAlertTriangle className="size-5" />
              <DialogTitle>Void Transaksi</DialogTitle>
            </div>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan transaksi{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {transaction.transactionNumber}
              </strong>{" "}
              senilai {formatIDR(transaction.totalAmount)}?
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 text-xs text-amber-800 dark:text-amber-300">
              Perhatian: Tindakan pembatalan (void) akan mengembalikan stok
              produk terkait ke display/etalase toko dan mencatat log audit
              kasir.
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="void-reason" className="text-xs font-medium">
                Alasan Pembatalan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="void-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Contoh: Salah input pesanan / pelanggan batal..."
                rows={3}
                className="text-sm resize-none"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi Void"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
