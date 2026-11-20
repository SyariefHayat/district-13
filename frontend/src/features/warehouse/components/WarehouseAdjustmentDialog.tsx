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
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import type { WarehouseInventoryItem } from "../data/warehouseData";

interface WarehouseAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WarehouseInventoryItem[];
  selectedItem?: WarehouseInventoryItem | null;
  onSuccess?: () => void;
}

export function WarehouseAdjustmentDialog({
  open,
  onOpenChange,
  items,
  selectedItem,
  onSuccess,
}: WarehouseAdjustmentDialogProps) {
  const { authorizedFetch } = useAuth();
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [location, setLocation] = React.useState<"WAREHOUSE" | "DISPLAY">(
    "DISPLAY"
  );
  const [actualStock, setActualStock] = React.useState<number>(0);
  const [reason, setReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (selectedItem) {
        setSelectedProductId(selectedItem.productId || selectedItem.id);
        setActualStock(
          location === "WAREHOUSE"
            ? selectedItem.warehouseStock
            : selectedItem.displayStock
        );
      } else if (items.length > 0 && !selectedProductId) {
        setSelectedProductId(items[0].productId || items[0].id);
        setActualStock(items[0].displayStock);
      }
      setReason("");
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

  // When location changes, update default actualStock to the current stock
  const handleLocationChange = (loc: "WAREHOUSE" | "DISPLAY") => {
    setLocation(loc);
    if (currentItem) {
      setActualStock(
        loc === "WAREHOUSE"
          ? currentItem.warehouseStock
          : currentItem.displayStock
      );
    }
  };

  const currentSystemStock =
    location === "WAREHOUSE"
      ? (currentItem?.warehouseStock ?? 0)
      : (currentItem?.displayStock ?? 0);
  const delta = actualStock - currentSystemStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMsg("Pilih produk terlebih dahulu");
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg("Alasan penyesuaian harus diisi minimal 3 karakter");
      return;
    }
    if (actualStock < 0) {
      setErrorMsg("Stok fisik aktual tidak boleh kurang dari 0");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const targetProductId = currentItem.productId || currentItem.id;
      const res = await authorizedFetch("/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({
          productId: targetProductId,
          location,
          actualStock: Math.floor(actualStock),
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Gagal menyimpan penyesuaian stok (${res.status})`
        );
      }

      toast.add({
        title: "Penyesuaian stok berhasil disimpan",
        description: `${currentItem.name} (${location}): ${currentSystemStock} ➔ ${actualStock} (${delta >= 0 ? `+${delta}` : delta})`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok (Stock Opname)</DialogTitle>
          <DialogDescription>
            Sesuaikan pencatatan stok sistem dengan perhitungan fisik riil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="product-select">Pilih Produk</Label>
            {selectedItem ? (
              <div className="rounded-lg border bg-muted/40 p-2.5">
                <div className="font-medium text-sm text-foreground">
                  {selectedItem.name}
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  SKU: {selectedItem.sku} | Gudang:{" "}
                  {selectedItem.warehouseStock} | Etalase:{" "}
                  {selectedItem.displayStock}
                </div>
              </div>
            ) : (
              <Select
                value={selectedProductId}
                onValueChange={(val) => {
                  if (!val) return;
                  setSelectedProductId(val);
                  const p = items.find((i) => (i.productId || i.id) === val);
                  if (p) {
                    setActualStock(
                      location === "WAREHOUSE"
                        ? p.warehouseStock
                        : p.displayStock
                    );
                  }
                }}
              >
                <SelectTrigger id="product-select">
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {items.map((item) => (
                    <SelectItem
                      key={item.productId || item.id}
                      value={item.productId || item.id}
                    >
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location-select">Lokasi Stok</Label>
              <Select
                value={location}
                onValueChange={(val) =>
                  handleLocationChange(val as "WAREHOUSE" | "DISPLAY")
                }
              >
                <SelectTrigger id="location-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISPLAY">Etalase (Display)</SelectItem>
                  <SelectItem value="WAREHOUSE">Gudang (Warehouse)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actual-stock">Stok Fisik Aktual</Label>
              <Input
                id="actual-stock"
                type="number"
                min={0}
                value={actualStock}
                onChange={(e) => setActualStock(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-2.5 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">
              Sistem saat ini:{" "}
              <strong className="text-foreground">{currentSystemStock}</strong>
            </span>
            <span className="font-semibold">
              Selisih:{" "}
              <span
                className={
                  delta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : delta < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
              >
                {delta > 0 ? `+${delta}` : delta} unit
              </span>
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjustment-reason">
              Alasan Penyesuaian <span className="text-destructive">*</span>
            </Label>
            <Input
              id="adjustment-reason"
              placeholder="Contoh: Selisih opname fisik, barang rusak, dll"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={3}
              maxLength={255}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="size-4 mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Penyesuaian"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
