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
import type { WarehouseInventoryItem } from "../data/warehouseData";

interface WarehouseRestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WarehouseInventoryItem[];
  selectedItem?: WarehouseInventoryItem | null;
  onRestock: (productId: string, quantity: number) => Promise<boolean>;
}

export function WarehouseRestockDialog({
  open,
  onOpenChange,
  items,
  selectedItem,
  onRestock,
}: WarehouseRestockDialogProps) {
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(10);
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (selectedItem) {
        setSelectedProductId(selectedItem.productId || selectedItem.id);
      } else if (items.length > 0 && !selectedProductId) {
        setSelectedProductId(items[0].productId || items[0].id);
      }
      setQuantity(10);
      setNotes("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMsg("Pilih produk terlebih dahulu");
      return;
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setErrorMsg("Kuantitas restock harus lebih dari 0");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await onRestock(currentItem.productId, quantity);
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal melakukan restock"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const newStockPreview = (currentItem?.warehouseStock ?? 0) + (quantity || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Restock Barang Masuk</DialogTitle>
            <DialogDescription>
              Tambahkan pasokan stok baru ke dalam gudang utama penyimpanan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {errorMsg && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Product Selection */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="restock-product">Pilih Produk</Label>
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
                  <SelectTrigger id="restock-product" className="w-full">
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {items.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.productId || item.id}
                      >
                        {item.name} ({item.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Stock status indicator */}
            {currentItem && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">
                    Stok Gudang Saat Ini
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {currentItem.warehouseStock} unit
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    Estimasi Setelah Masuk
                  </span>
                  <span className="text-base font-semibold text-primary">
                    {newStockPreview} unit
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Input */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="restock-qty">Jumlah Masuk (Unit)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 5))}
                  className="size-9 p-0"
                >
                  -5
                </Button>
                <Input
                  id="restock-qty"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="text-center font-medium"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity((prev) => prev + 5)}
                  className="size-9 p-0"
                >
                  +5
                </Button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[10, 25, 50, 100].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => setQuantity(preset)}
                  >
                    +{preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="restock-notes">Catatan / No. PO (Opsional)</Label>
              <Input
                id="restock-notes"
                placeholder="Contoh: Pengiriman PO-8891 dari Supplier"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Spinner className="size-4" />}
              <span>Konfirmasi Masuk</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
