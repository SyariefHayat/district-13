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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { IconArrowRight } from "@tabler/icons-react";
import type { WarehouseInventoryItem } from "../data/warehouseData";

interface WarehouseTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WarehouseInventoryItem[];
  selectedItem?: WarehouseInventoryItem | null;
  onTransfer: (productId: string, quantity: number) => Promise<boolean>;
}

export function WarehouseTransferDialog({
  open,
  onOpenChange,
  items,
  selectedItem,
  onTransfer,
}: WarehouseTransferDialogProps) {
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(5);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (selectedItem) {
        setSelectedProductId(selectedItem.productId || selectedItem.id);
        const maxAvailable = Math.max(1, selectedItem.warehouseStock);
        setQuantity(Math.min(5, maxAvailable));
      } else if (items.length > 0 && !selectedProductId) {
        setSelectedProductId(items[0].productId || items[0].id);
        setQuantity(Math.min(5, Math.max(1, items[0].warehouseStock)));
      }
      setErrorMsg(null);
    }
  }, [open, selectedItem, items]);

  const currentItem = React.useMemo(() => {
    return (
      items.find(
        (i) => i.productId === selectedProductId || i.id === selectedProductId
      ) ||
      selectedItem ||
      null
    );
  }, [items, selectedProductId, selectedItem]);

  const maxTransferable = currentItem ? currentItem.warehouseStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMsg("Pilih produk terlebih dahulu");
      return;
    }
    if (maxTransferable <= 0) {
      setErrorMsg("Stok gudang produk ini kosong (0 unit)");
      return;
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setErrorMsg("Kuantitas transfer harus minimal 1");
      return;
    }
    if (quantity > maxTransferable) {
      setErrorMsg(
        `Kuantitas melebihi stok gudang yang tersedia (${maxTransferable} unit)`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await onTransfer(currentItem.productId, quantity);
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mentransfer stok"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingWarehouseStock =
    (currentItem?.warehouseStock ?? 0) - (quantity || 0);
  const newDisplayStock = (currentItem?.displayStock ?? 0) + (quantity || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Transfer Stok ke Etalase</DialogTitle>
            <DialogDescription>
              Pindahkan stok dari gudang penyimpanan utama ke etalase
              kasir/toko.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {errorMsg && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Product selection */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-product">Pilih Produk</Label>
              {selectedItem ? (
                <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-sm">
                  <div className="font-medium text-foreground">
                    {selectedItem.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    SKU: {selectedItem.sku} • Kategori: {selectedItem.category}
                  </div>
                </div>
              ) : (
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => {
                    if (val) setSelectedProductId(val);
                    setErrorMsg(null);
                  }}
                >
                  <SelectTrigger id="transfer-product" className="w-full">
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {items.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.productId || item.id}
                        disabled={item.warehouseStock <= 0}
                      >
                        {item.name} (Tersedia: {item.warehouseStock} di gudang)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Current Stock vs Result Comparison */}
            {currentItem && (
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between font-medium text-muted-foreground pb-1 border-b border-border/40">
                  <span>Gudang Utama</span>
                  <IconArrowRight className="size-4 text-muted-foreground" />
                  <span>Etalase Toko</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Stok Sekarang
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {currentItem.warehouseStock} unit
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">
                      Stok Sekarang
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {currentItem.displayStock} unit
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Setelah Transfer
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        remainingWarehouseStock < 0
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {remainingWarehouseStock} unit
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">
                      Setelah Transfer
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {newDisplayStock} unit
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity to transfer */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="transfer-qty">Jumlah Ditransfer (Unit)</Label>
                <span className="text-xs text-muted-foreground">
                  Maks: {maxTransferable} unit
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="size-9 p-0"
                  disabled={quantity <= 1}
                >
                  -1
                </Button>
                <Input
                  id="transfer-qty"
                  type="number"
                  min="1"
                  max={maxTransferable || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="text-center font-medium"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuantity((prev) => Math.min(maxTransferable, prev + 1))
                  }
                  className="size-9 p-0"
                  disabled={quantity >= maxTransferable}
                >
                  +1
                </Button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[5, 10, 20].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    disabled={maxTransferable < preset}
                    onClick={() => setQuantity(preset)}
                  >
                    {preset}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  disabled={maxTransferable <= 0}
                  onClick={() => setQuantity(maxTransferable)}
                >
                  Maks ({maxTransferable})
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || maxTransferable <= 0}
              className="gap-1.5"
            >
              {isSubmitting && <Spinner className="size-4" />}
              <span>Kirim ke Etalase</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
