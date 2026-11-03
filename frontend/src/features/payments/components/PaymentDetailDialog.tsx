import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  formatPaymentAmount,
  PAYMENT_TYPE_LABELS,
  type PaymentMethodItem,
} from "../data/paymentData";

interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentMethodItem | null;
}

export function PaymentDetailDialog({
  open,
  onOpenChange,
  payment,
}: PaymentDetailDialogProps) {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-semibold">
              Detail Metode Pembayaran
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                payment.isActive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                  : "border-muted text-muted-foreground font-medium"
              }
            >
              {payment.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <DialogDescription className="font-mono text-xs">
            Kode: {payment.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Nama Metode</span>
              <span className="font-semibold text-foreground">
                {payment.name}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Kategori</span>
              <span className="font-medium text-foreground">
                {PAYMENT_TYPE_LABELS[payment.type]}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Provider</span>
              <span className="font-medium text-foreground">
                {payment.provider}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Nomor Akun / ID
              </span>
              <span className="font-mono text-xs text-foreground">
                {payment.accountNumber || "-"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Biaya MDR</span>
              <span className="font-medium text-foreground">
                {payment.feePercentage === 0
                  ? "Gratis (0%)"
                  : `${payment.feePercentage.toFixed(1)}%`}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Settlement</span>
              <span className="font-medium text-foreground">
                {payment.settlementTime}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Minimal Transaksi
              </span>
              <span className="font-medium text-foreground">
                {formatPaymentAmount(payment.minAmount)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Total Transaksi
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {payment.transactionCount.toLocaleString("id-ID")} trx
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Total Omzet Terproses
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatPaymentAmount(payment.totalVolume)}
              </span>
            </div>
          </div>

          {payment.description && (
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground block mb-0.5">
                Catatan Kasir:
              </span>
              {payment.description}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
