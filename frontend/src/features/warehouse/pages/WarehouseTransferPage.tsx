import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconArrowsTransferUpDown,
  IconBuildingStore,
  IconBuildingWarehouse,
  IconCheck,
  IconChevronLeft,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useWarehouseData } from "../hooks/useWarehouseData";

export default function WarehouseTransferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";

  const { items, isLoading, transferToDisplay } = useWarehouseData();

  const [selectedProductId, setSelectedProductId] =
    React.useState<string>(initialProductId);
  const [quantity, setQuantity] = React.useState<number>(5);
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Sync initial product if items load after mount
  React.useEffect(() => {
    if (items.length > 0) {
      if (initialProductId) {
        const found = items.find(
          (i) => i.productId === initialProductId || i.id === initialProductId
        );
        if (found) {
          setSelectedProductId(found.productId || found.id);
          const maxAvail = Math.max(1, found.warehouseStock);
          setQuantity(Math.min(5, maxAvail));
          return;
        }
      }
      if (!selectedProductId) {
        setSelectedProductId(items[0].productId || items[0].id);
        const maxAvail = Math.max(1, items[0].warehouseStock);
        setQuantity(Math.min(5, maxAvail));
      }
    }
  }, [items, initialProductId, selectedProductId]);

  const currentItem = React.useMemo(() => {
    return (
      items.find(
        (i) => i.productId === selectedProductId || i.id === selectedProductId
      ) || null
    );
  }, [items, selectedProductId]);

  const maxTransferable = currentItem ? currentItem.warehouseStock : 0;
  const isOutOfStockInWarehouse = maxTransferable <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMsg("Pilih produk terlebih dahulu");
      return;
    }
    if (isOutOfStockInWarehouse) {
      setErrorMsg("Stok gudang untuk produk ini kosong (0 unit)");
      return;
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setErrorMsg("Kuantitas transfer minimal 1");
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
      const success = await transferToDisplay(currentItem.productId, quantity);
      if (success) {
        navigate("/dashboard/stocks");
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mentransfer stok ke etalase"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingWarehouseStock = Math.max(
    0,
    maxTransferable - (quantity || 0)
  );
  const newDisplayStock = (currentItem?.displayStock ?? 0) + (quantity || 0);

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 md:px-6 max-w-5xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard/stocks")}
            title="Kembali ke daftar stok"
          >
            <IconChevronLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Transfer Stok ke Etalase
            </h1>
          </div>
        </div>

        {/* Action Buttons: Discard, Confirm Transfer */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => navigate("/dashboard/stocks")}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="transfer-form"
            disabled={isSubmitting || isOutOfStockInWarehouse || !currentItem}
            className="gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <Spinner className="size-4" />
            ) : (
              <IconCheck className="size-4" />
            )}
            <span>{isSubmitting ? "Memproses..." : "Konfirmasi Transfer"}</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setErrorMsg(null)}
            className="size-7 p-0"
          >
            <IconX className="size-4" />
          </Button>
        </div>
      )}

      {isOutOfStockInWarehouse && currentItem && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IconAlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium">
              Stok gudang untuk <b>{currentItem.name}</b> kosong (0 unit). Perlu
              restock terlebih dahulu sebelum dapat transfer ke etalase.
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              navigate(
                `/dashboard/stocks/restock?productId=${currentItem.productId}`
              )
            }
            className="gap-1.5 shrink-0"
          >
            <IconPlus className="size-4" />
            <span>Restock Sekarang</span>
          </Button>
        </div>
      )}

      <form
        id="transfer-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Left Column: Input Form */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2">
              <IconArrowsTransferUpDown className="size-4 text-muted-foreground" />
              <span>Detail Pemindahan Stok</span>
            </h2>

            {/* Product Selection */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-product" className="font-medium">
                Pilih Produk
              </Label>
              {isLoading ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              ) : (
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => {
                    if (val) {
                      setSelectedProductId(val);
                      const target = items.find(
                        (i) => i.productId === val || i.id === val
                      );
                      if (target) {
                        setQuantity(
                          Math.min(5, Math.max(1, target.warehouseStock))
                        );
                      }
                    }
                  }}
                >
                  <SelectTrigger id="transfer-product" className="w-full">
                    <SelectValue placeholder="Pilih produk yang akan dipindah" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {items.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.productId || item.id}
                      >
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="font-medium truncate">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.sku} (Tersedia: {item.warehouseStock})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {currentItem && (
                <div className="mt-1 flex items-center justify-between p-3 rounded-lg bg-muted/40 border text-xs">
                  <div>
                    <span className="text-muted-foreground">Kategori: </span>
                    <span className="font-medium">{currentItem.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stok Gudang: </span>
                    <span className="font-semibold text-foreground">
                      {currentItem.warehouseStock} unit
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Stok Etalase:{" "}
                    </span>
                    <span className="font-semibold text-foreground">
                      {currentItem.displayStock} unit
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Input */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="transfer-qty" className="font-medium">
                  Kuantitas Transfer (Unit)
                </Label>
                {maxTransferable > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Maks. {maxTransferable} unit tersedia
                  </span>
                )}
              </div>
              <Input
                id="transfer-qty"
                type="number"
                min="1"
                max={maxTransferable || 1}
                step="1"
                disabled={isOutOfStockInWarehouse}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setQuantity(Math.min(maxTransferable, Math.max(1, val)));
                }}
                className="font-mono text-base h-10"
                required
              />

              {/* Quick Stepper Buttons */}
              {!isOutOfStockInWarehouse && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Cepat:</span>
                  {[1, 5, 10, 20].map((step) => (
                    <Button
                      key={step}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      disabled={maxTransferable < step}
                      onClick={() => setQuantity(step)}
                    >
                      {step}
                    </Button>
                  ))}
                  {maxTransferable > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2.5 text-xs font-medium ml-auto"
                      onClick={() => setQuantity(maxTransferable)}
                    >
                      Semua ({maxTransferable})
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div className="flex flex-col gap-1.5 pt-2 border-t">
              <Label
                htmlFor="transfer-notes"
                className="text-xs text-muted-foreground"
              >
                Keterangan / Alasan Pemindahan (Opsional)
              </Label>
              <Input
                id="transfer-notes"
                placeholder="Contoh: Pengisian rak display kasir shift pagi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Visual Matrix & Confirmation */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2">
              <IconBuildingStore className="size-4 text-muted-foreground" />
              <span>Matriks Distribusi Stok</span>
            </h2>

            {/* Visualizer Cards */}
            <div className="space-y-3">
              {/* Warehouse Card */}
              <div className="p-3.5 rounded-lg border bg-muted/20 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <IconBuildingWarehouse className="size-3.5" />
                    Gudang Utama
                  </span>
                  <span>Dikurangi</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs line-through text-muted-foreground tabular-nums">
                    {maxTransferable} unit
                  </span>
                  <div className="flex items-center gap-1.5">
                    <IconArrowRight className="size-3 text-muted-foreground" />
                    <span className="text-base font-bold text-foreground tabular-nums">
                      {remainingWarehouseStock} unit
                    </span>
                  </div>
                </div>
              </div>

              {/* Transfer Arrow Indicator */}
              <div className="flex items-center justify-center -my-1 text-blue-500 dark:text-blue-400">
                <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                  <IconArrowsTransferUpDown className="size-3.5" />
                  <span>Transfer {quantity || 0} unit</span>
                </div>
              </div>

              {/* Display Store Card */}
              <div className="p-3.5 rounded-lg border bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/50 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                    <IconBuildingStore className="size-3.5" />
                    Etalase Kasir
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Bertambah
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs line-through text-muted-foreground tabular-nums">
                    {currentItem?.displayStock ?? 0} unit
                  </span>
                  <div className="flex items-center gap-1.5">
                    <IconArrowRight className="size-3 text-blue-500" />
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {newDisplayStock} unit
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
