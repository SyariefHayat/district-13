import { useState, useEffect } from "react";
import {
  IconPlus,
  IconMinus,
  IconCheck,
  IconAlertCircle,
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
  const isMaxStockReached =
    product.displayStock > 0 && quantity >= product.displayStock;

  const handleConfirm = () => {
    onConfirm(product, selectedAddons, notes, quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 max-h-[90vh] overflow-y-auto">
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border text-xs">
            <span className="text-muted-foreground">Harga Dasar Produk:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                {formatIDR(product.price)}
              </span>
              <Badge variant="outline" className="text-[10px]">
                Sisa: {product.displayStock} pcs
              </Badge>
            </div>
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
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer min-h-[44px] transition-colors ${
                        isChecked
                          ? "border-primary/50 bg-primary/5 text-foreground font-semibold"
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
                      <span className="font-bold text-primary">
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
              className="text-xs h-11"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Jumlah Pesanan:</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] rounded-md"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <IconMinus className="size-4" />
                </Button>
                <span className="w-8 text-center text-sm font-bold">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] rounded-md"
                  onClick={() =>
                    setQuantity((q) =>
                      product.displayStock > 0
                        ? Math.min(product.displayStock, q + 1)
                        : q + 1
                    )
                  }
                  disabled={isMaxStockReached}
                >
                  <IconPlus className="size-4" />
                </Button>
              </div>
            </div>

            {/* Remaining Stock Indicator */}
            {isMaxStockReached && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 p-2 rounded-lg">
                <IconAlertCircle className="size-3.5 shrink-0" />
                <span>
                  Maksimal jumlah pesanan tercapai sesuai stok display (Sisa:{" "}
                  {product.displayStock} pcs)
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-3 border-t">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium">
              Total Item:
            </span>
            <span className="text-sm font-black text-primary">
              {formatIDR(itemTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-[44px] px-3.5 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="gap-1.5 font-bold min-h-[44px] px-4 text-xs"
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
