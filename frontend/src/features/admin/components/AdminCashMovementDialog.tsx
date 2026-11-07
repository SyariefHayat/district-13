import * as React from "react";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCash,
} from "@tabler/icons-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatIDR, type AdminActiveShift } from "../data/adminData";

interface AdminCashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeShifts: AdminActiveShift[];
  defaultShiftId?: string | null;
  onSubmit: (
    shiftId: string,
    type: "IN" | "OUT",
    amount: number,
    description?: string
  ) => Promise<boolean>;
}

export function AdminCashMovementDialog({
  open,
  onOpenChange,
  activeShifts,
  defaultShiftId,
  onSubmit,
}: AdminCashMovementDialogProps) {
  const [selectedShiftId, setSelectedShiftId] = React.useState<string>("");
  const [type, setType] = React.useState<"IN" | "OUT">("IN");
  const [amount, setAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setErrorMsg(null);
      setAmount("");
      setDescription("");
      setType("IN");
      if (defaultShiftId) {
        setSelectedShiftId(defaultShiftId);
      } else if (activeShifts.length > 0) {
        setSelectedShiftId(activeShifts[0].id);
      } else {
        setSelectedShiftId("");
      }
    }
  }, [open, defaultShiftId, activeShifts]);

  const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, "") || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) {
      setErrorMsg("Pilih shift kasir tujuan terlebih dahulu.");
      return;
    }
    if (numericAmount <= 0) {
      setErrorMsg("Jumlah kas harus lebih besar dari 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    const success = await onSubmit(
      selectedShiftId,
      type,
      numericAmount,
      description
    );
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
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconCash className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Catat Kas Operasional
              </DialogTitle>
              <DialogDescription className="text-xs">
                Catat arus kas masuk (modal tambahan, tukar uang) atau kas
                keluar (biaya operasional, bensin, dll)
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

          {/* Shift Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Shift Kasir Tujuan</Label>
            {activeShifts.length === 0 ? (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                Tidak ada shift kasir yang aktif saat ini. Kas operasional hanya
                dapat dicatat pada shift kasir yang sedang berjalan.
              </div>
            ) : (
              <Select
                value={selectedShiftId}
                onValueChange={(val) => setSelectedShiftId(val ?? "")}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Pilih kasir / register" />
                </SelectTrigger>
                <SelectContent>
                  {activeShifts.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.cashierName} (Laci saat ini:{" "}
                      {formatIDR(s.expectedCash)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Type Toggle Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Jenis Arus Kas</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "IN" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("IN")}
                className={`h-9 gap-1.5 text-xs font-medium ${
                  type === "IN"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "text-muted-foreground"
                }`}
              >
                <IconArrowDownLeft className="size-4" />
                Kas Masuk (IN)
              </Button>
              <Button
                type="button"
                variant={type === "OUT" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("OUT")}
                className={`h-9 gap-1.5 text-xs font-medium ${
                  type === "OUT"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "text-muted-foreground"
                }`}
              >
                <IconArrowUpRight className="size-4" />
                Kas Keluar (OUT)
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="cash-amount" className="text-xs font-medium">
              Jumlah Nominal (Rp)
            </Label>
            <Input
              id="cash-amount"
              type="number"
              min="1000"
              step="500"
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-sm font-mono"
              required
            />
            {numericAmount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Terbaca: {formatIDR(numericAmount)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cash-desc" className="text-xs font-medium">
              Keterangan / Alasan (Opsional)
            </Label>
            <Textarea
              id="cash-desc"
              rows={2}
              placeholder="Contoh: Tambah uang kembalian pecahan kecil, atau beli es batu toko"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              size="sm"
              disabled={isSubmitting || numericAmount <= 0 || !selectedShiftId}
              className="text-xs"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-3.5 mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Kas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
