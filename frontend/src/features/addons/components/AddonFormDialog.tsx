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
import { Spinner } from "@/components/ui/spinner";
import { ADDON_CATEGORIES, type AddonItem } from "../data/addonData";

interface AddonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon?: AddonItem | null;
  categories?: string[];
  onSubmit: (values: {
    name: string;
    category: string;
    price: number;
    isActive: boolean;
  }) => Promise<boolean>;
}

export function AddonFormDialog({
  open,
  onOpenChange,
  addon,
  categories = [],
  onSubmit,
}: AddonFormDialogProps) {
  const isEditing = Boolean(addon);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Espresso & Kopi");
  const [priceStr, setPriceStr] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const availableCategories = React.useMemo(() => {
    const combined = Array.from(
      new Set([
        ...ADDON_CATEGORIES.filter((c) => c !== "Semua Kategori"),
        ...categories.filter((c) => c !== "Semua Kategori"),
      ])
    );
    return combined;
  }, [categories]);

  React.useEffect(() => {
    if (addon) {
      setName(addon.name);
      setCategory(addon.category || availableCategories[0] || "Umum");
      setPriceStr(addon.price.toString());
      setIsActive(addon.isActive);
    } else {
      setName("");
      setCategory(availableCategories[0] || "Espresso & Kopi");
      setPriceStr("");
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [addon, open, availableCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg("Nama add-on wajib diisi");
      return;
    }

    const rawDigits = priceStr.replace(/\D/g, "");
    const priceNum = rawDigits ? parseInt(rawDigits, 10) : 0;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await onSubmit({
        name: cleanName,
        category,
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
              ? "Perbarui informasi nama, kategori, harga, dan ketersediaan add-on."
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="addon-category" className="text-xs font-medium">
                Kategori
              </Label>
              <Select
                value={category}
                onValueChange={(val) => {
                  if (val) setCategory(val);
                }}
              >
                <SelectTrigger id="addon-category" className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="addon-price" className="text-xs font-medium">
                Harga Tambahan (IDR)
              </Label>
              <Input
                id="addon-price"
                type="number"
                min="0"
                step="500"
                placeholder="Contoh: 6000"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                required
              />
            </div>
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
