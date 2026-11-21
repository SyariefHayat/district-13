import * as React from "react";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { formatIDR } from "../data/cashierData";

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    type: "IN" | "OUT",
    amount: string,
    description?: string
  ) => Promise<boolean>;
}

export function CashMovementDialog({
  open,
  onOpenChange,
  onConfirm,
}: CashMovementDialogProps) {
  const [type, setType] = React.useState<"IN" | "OUT">("IN");
  const [amount, setAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setType("IN");
    }
  }, [open]);

  const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, "") || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || numericAmount <= 0 || !description.trim()) return;

    setIsSubmitting(true);
    const success = await onConfirm(type, amount, description.trim());
    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <IconCash className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Mutasi Kas Laci Kasir
              </DialogTitle>
              <DialogDescription className="text-xs">
                Catat penambahan kas masuk atau pengeluaran tunai dari laci
                kasir.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
          {/* Movement Type Toggle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Jenis Mutasi
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "IN" ? "default" : "outline"}
                className={`min-h-[44px] font-semibold flex items-center justify-center gap-2 ${
                  type === "IN"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : ""
                }`}
                onClick={() => setType("IN")}
              >
                <IconArrowDownLeft className="size-4" />
                <span>Kas Masuk (In)</span>
              </Button>
              <Button
                type="button"
                variant={type === "OUT" ? "default" : "outline"}
                className={`min-h-[44px] font-semibold flex items-center justify-center gap-2 ${
                  type === "OUT"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : ""
                }`}
                onClick={() => setType("OUT")}
              >
                <IconArrowUpRight className="size-4" />
                <span>Kas Keluar (Out)</span>
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="movement-amount" className="text-xs font-semibold">
              Nominal {type === "IN" ? "Kas Masuk" : "Kas Keluar"}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="movement-amount"
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="pl-10 text-base font-bold h-11"
                autoFocus
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Terbaca:{" "}
              <span className="font-bold text-foreground">
                {formatIDR(numericAmount)}
              </span>
            </p>
          </div>

          {/* Reason / Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="movement-notes" className="text-xs font-semibold">
              Alasan / Keperluan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="movement-notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === "IN"
                  ? "Contoh: Tambah uang pecahan kecil dari brankas"
                  : "Contoh: Beli air mineral galon / plastik kresek kasir"
              }
              rows={2}
              className="resize-none text-xs"
              required
            />
          </div>

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
              disabled={isSubmitting || numericAmount <= 0}
              className={`min-h-[44px] font-bold px-4 ${
                type === "IN"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Menyimpan...
                </>
              ) : type === "IN" ? (
                "Simpan Kas Masuk"
              ) : (
                "Simpan Kas Keluar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
