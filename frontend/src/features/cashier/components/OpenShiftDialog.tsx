import * as React from "react";
import { IconCoins, IconDoorEnter } from "@tabler/icons-react";
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
import { Spinner } from "@/components/ui/spinner";
import { formatIDR } from "../data/cashierData";

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (openingCash: string) => Promise<boolean>;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

export function OpenShiftDialog({
  open,
  onOpenChange,
  onConfirm,
}: OpenShiftDialogProps) {
  const [openingCash, setOpeningCash] = React.useState<string>("100000");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setOpeningCash("100000");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const success = await onConfirm(openingCash);
    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const numericValue = parseFloat(openingCash.replace(/[^0-9.]/g, "") || "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <IconDoorEnter className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Buka Shift Kasir
              </DialogTitle>
              <DialogDescription className="text-xs">
                Masukkan saldo modal awal fisik di dalam laci kasir (drawer).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="opening-cash" className="text-sm font-medium">
              Modal Awal Kasir (Uang Fisik)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <Input
                id="opening-cash"
                type="number"
                min="0"
                step="1000"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0"
                className="pl-10 text-base font-semibold"
                autoFocus
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Terbaca:{" "}
              <span className="font-semibold text-foreground">
                {formatIDR(numericValue)}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Nominal Cepat:
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  type="button"
                  variant={numericValue === amt ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs font-medium"
                  onClick={() => setOpeningCash(amt.toString())}
                >
                  {formatIDR(amt).replace("Rp", "").trim()}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <IconCoins className="size-4 shrink-0 mt-0.5 text-primary" />
            <span>
              Pastikan hitung pecahan uang tunai di laci sebelum konfirmasi
              untuk menghindari selisih saat penutupan shift nanti.
            </span>
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
            <Button type="submit" disabled={isSubmitting || numericValue < 0}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Membuka Shift...
                </>
              ) : (
                "Buka Shift Sekarang"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
