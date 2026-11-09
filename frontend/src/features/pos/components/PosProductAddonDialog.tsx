import { useState, useEffect } from "react";
import { IconPlus, IconMinus, IconCheck } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatIDR } from "@/features/product/data/productData";
import type { PosProductItem, PosAddon } from "../types/posTypes";

interface PosProductAddonDialogProps {
  product: PosProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    product: PosProductItem,
    selectedAddons: PosAddon[],
    notes: string,
    quantity: number
  ) => void;
}

export function PosProductAddonDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: PosProductAddonDialogProps) {
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (open) {
      setSelectedAddonIds([]);
      setNotes("");
      setQuantity(1);
    }
  }, [open, product]);

  if (!product) return null;

  const addons = product.addons || [];

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitTotal = product.price + addonsTotal;
  const itemTotal = unitTotal * quantity;

  const handleConfirm = () => {
    onConfirm(product, selectedAddons, notes, quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold">
              {product.name}
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              {product.categoryName}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Pilih varian add-on atau tambahkan catatan pesanan khusus.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Base Price & Stock */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs">
            <span className="text-muted-foreground">Harga Dasar Produk:</span>
            <span className="font-semibold text-foreground">
              {formatIDR(product.price)}
            </span>
          </div>

          {/* Addons List */}
          {addons.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Pilihan Add-on / Tambahan:</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Opsional
                </span>
              </label>

              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {addons.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "border-primary/50 bg-primary/5 text-foreground font-medium"
                          : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleAddon(addon.id)}
                          className="size-4"
                        />
                        <span>{addon.name}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        +{formatIDR(addon.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Catatan Pesanan:
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Less sugar, es sedikit, pisah sambal..."
              className="text-xs h-9"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs font-semibold">Jumlah Pesanan:</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <IconMinus className="size-3.5" />
              </Button>
              <span className="w-8 text-center text-sm font-bold">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() =>
                  setQuantity((q) =>
                    product.displayStock > 0
                      ? Math.min(product.displayStock, q + 1)
                      : q + 1
                  )
                }
                disabled={
                  product.displayStock > 0 && quantity >= product.displayStock
                }
              >
                <IconPlus className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-2 border-t">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">
              Total Item:
            </span>
            <span className="text-sm font-bold text-primary">
              {formatIDR(itemTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="gap-1.5 font-medium"
            >
              <IconCheck className="size-4" />
              <span>Tambah ke Keranjang</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
