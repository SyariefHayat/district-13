import * as React from "react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  PAYMENT_TYPE_LABELS,
  type PaymentMethodItem,
  type PaymentType,
} from "../data/paymentData";

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: PaymentMethodItem | null;
  onSubmit: (values: {
    name: string;
    code: string;
    type: PaymentType;
    provider: string;
    accountNumber: string;
    feePercentage: number;
    settlementTime: string;
    minAmount: number;
    description: string;
    isActive: boolean;
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  }) => Promise<boolean>;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  payment,
  onSubmit,
}: PaymentFormDialogProps) {
  const isEditing = Boolean(payment);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<PaymentType>("QRIS");
  const [provider, setProvider] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [feePercentage, setFeePercentage] = React.useState("0.7");
  const [settlementTime, setSettlementTime] = React.useState("T+1 Hari Kerja");
  const [minAmount, setMinAmount] = React.useState("0");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (payment) {
      setName(payment.name);
      setCode(payment.code);
      setType(payment.type);
      setProvider(payment.provider);
      setAccountNumber(payment.accountNumber);
      setFeePercentage(payment.feePercentage.toString());
      setSettlementTime(payment.settlementTime);
      setMinAmount(payment.minAmount.toString());
      setDescription(payment.description || "");
      setIsActive(payment.isActive);
    } else {
      setName("");
      setCode("");
      setType("QRIS");
      setProvider("");
      setAccountNumber("");
      setFeePercentage("0.7");
      setSettlementTime("T+1 Hari Kerja");
      setMinAmount("0");
      setDescription("");
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [payment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Nama metode pembayaran wajib diisi.");
      return;
    }
    if (!code.trim()) {
      setErrorMsg("Kode unik metode pembayaran wajib diisi.");
      return;
    }
    if (!provider.trim()) {
      setErrorMsg("Provider / Penerbit wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        provider: provider.trim(),
        accountNumber: accountNumber.trim(),
        feePercentage: parseFloat(feePercentage) || 0,
        settlementTime: settlementTime.trim(),
        minAmount: parseInt(minAmount, 10) || 0,
        description: description.trim(),
        isActive,
        status: isActive ? "ACTIVE" : "INACTIVE",
      });

      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui konfigurasi saluran pembayaran dan parameter fee."
              : "Daftarkan saluran pembayaran baru untuk digunakan di kasir POS."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="method-name" className="text-xs">
                Nama Saluran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="method-name"
                placeholder="Contoh: QRIS BCA Dinamis"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method-code" className="text-xs">
                Kode Unik <span className="text-destructive">*</span>
              </Label>
              <Input
                id="method-code"
                placeholder="Contoh: QRIS_BCA"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="method-type" className="text-xs">
                Tipe Pembayaran
              </Label>
              <Select
                value={type}
                onValueChange={(val) => setType(val as PaymentType)}
              >
                <SelectTrigger id="method-type">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {PAYMENT_TYPE_LABELS[key]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method-provider" className="text-xs">
                Provider / Vendor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="method-provider"
                placeholder="Contoh: Bank BCA / Midtrans"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="method-account" className="text-xs">
                Nomor Akun / NMID / TID
              </Label>
              <Input
                id="method-account"
                placeholder="Contoh: NMID: ID10200392019"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method-fee" className="text-xs">
                Biaya MDR (%)
              </Label>
              <Input
                id="method-fee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0.7"
                value={feePercentage}
                onChange={(e) => setFeePercentage(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="method-settlement" className="text-xs">
                Waktu Settlement
              </Label>
              <Input
                id="method-settlement"
                placeholder="Contoh: T+1 Hari Kerja"
                value={settlementTime}
                onChange={(e) => setSettlementTime(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="method-min" className="text-xs">
                Minimal Transaksi (Rp)
              </Label>
              <Input
                id="method-min"
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method-desc" className="text-xs">
              Catatan / Instruksi Kasir
            </Label>
            <Textarea
              id="method-desc"
              rows={2}
              placeholder="Tambahkan catatan khusus untuk kasir pos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="is-active"
              checked={isActive}
              onCheckedChange={(val) => setIsActive(!!val)}
            />
            <Label htmlFor="is-active" className="text-sm cursor-pointer">
              Aktifkan metode pembayaran ini di kasir
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 mr-1.5" />}
              <span>{isEditing ? "Simpan Perubahan" : "Tambah Metode"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
