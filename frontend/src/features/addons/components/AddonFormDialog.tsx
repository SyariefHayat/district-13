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
import { Spinner } from "@/components/ui/spinner";
import type { AddonItem } from "../data/addonData";

interface AddonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon?: AddonItem | null;
  onSubmit: (values: {
    name: string;
    price: number;
    isActive: boolean;
  }) => Promise<boolean>;
}

function formatRupiah(value?: number): string {
  if (value === undefined || value === null) return "";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function parseRupiah(raw: string): number {
  const clean = raw.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

export function AddonFormDialog({
  open,
  onOpenChange,
  addon,
  onSubmit,
}: AddonFormDialogProps) {
  const isEditing = Boolean(addon);
  const [name, setName] = React.useState("");
  const [priceStr, setPriceStr] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (addon) {
      setName(addon.name);
      setPriceStr(formatRupiah(addon.price));
      setIsActive(addon.isActive);
    } else {
      setName("");
      setPriceStr("");
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [addon, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg("Nama add-on wajib diisi");
      return;
    }

    const priceNum = parseRupiah(priceStr);

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await onSubmit({
        name: cleanName,
        price: priceNum,
        isActive,
      });
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan add-on"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Ubah Data Add-on" : "Tambah Add-on Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi nama, harga, dan ketersediaan add-on."
              : "Tambahkan opsi kustomisasi atau bahan tambahan untuk menu kasir."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="addon-name" className="text-xs font-medium">
              Nama Add-on / Tambahan
            </Label>
            <Input
              id="addon-name"
              placeholder="Contoh: Oat Milk, Extra Shot, Vanilla Syrup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addon-price" className="text-xs font-medium">
              Harga Tambahan
            </Label>
            <Input
              id="addon-price"
              type="text"
              inputMode="numeric"
              placeholder="Rp 0"
              value={priceStr}
              onChange={(e) => {
                const rawDigits = e.target.value.replace(/\D/g, "");
                if (!rawDigits) {
                  setPriceStr("");
                } else {
                  const num = parseInt(rawDigits, 10);
                  setPriceStr(`Rp ${num.toLocaleString("id-ID")}`);
                }
              }}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="addon-status"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
            <Label
              htmlFor="addon-status"
              className="text-xs font-medium cursor-pointer"
            >
              Aktif (dapat dipilih di kasir dan menu)
            </Label>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Spinner className="size-3.5" />}
              <span>{isEditing ? "Simpan Perubahan" : "Simpan Add-on"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
