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
  IconBuildingWarehouse,
  IconCheck,
  IconChevronLeft,
  IconFileText,
  IconPlus,
  IconTruckLoading,
  IconX,
} from "@tabler/icons-react";
import { useWarehouseData } from "../hooks/useWarehouseData";
import { formatIDR, getWarehouseStockStatus } from "../data/warehouseData";

export default function WarehouseRestockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";

  const { items, isLoading, restock } = useWarehouseData();

  const [selectedProductId, setSelectedProductId] =
    React.useState<string>(initialProductId);
  const [quantity, setQuantity] = React.useState<number>(10);
  const [invoiceNumber, setInvoiceNumber] = React.useState<string>("");
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
          return;
        }
      }
      if (!selectedProductId) {
        setSelectedProductId(items[0].productId || items[0].id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMsg("Pilih produk terlebih dahulu");
      return;
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setErrorMsg("Kuantitas restock harus bilangan bulat positif (minimal 1)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await restock(currentItem.productId, quantity);
      if (success) {
        navigate("/dashboard/stocks");
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal melakukan restock barang"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStock = currentItem?.warehouseStock ?? 0;
  const newStockPreview = currentStock + (quantity || 0);
  const costPrice = currentItem?.costPrice ?? 0;
  const valuationAddition = (quantity || 0) * costPrice;

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
              Restock Barang Masuk
            </h1>
          </div>
        </div>

        {/* Action Buttons: Discard, Confirm Restock */}
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
            form="restock-form"
            disabled={isSubmitting || !currentItem}
            className="gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <Spinner className="size-4" />
            ) : (
              <IconCheck className="size-4" />
            )}
            <span>{isSubmitting ? "Menyimpan..." : "Konfirmasi Restock"}</span>
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

      <form
        id="restock-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Left Column: Form Details */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2">
              <IconBuildingWarehouse className="size-4 text-muted-foreground" />
              <span>Detail Barang & Pasokan</span>
            </h2>

            {/* Product Selection */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="restock-product" className="font-medium">
                Pilih Produk
              </Label>
              {isLoading ? (
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              ) : (
                <Select
                  value={selectedProductId}
                  onValueChange={(val) => {
                    if (val) setSelectedProductId(val);
                  }}
                >
                  <SelectTrigger id="restock-product" className="w-full">
                    <SelectValue placeholder="Pilih produk untuk di-restock" />
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
                            {item.sku} (Gudang: {item.warehouseStock})
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
                    <span className="text-muted-foreground">Status: </span>
                    <span className="font-semibold capitalize">
                      {getWarehouseStockStatus(currentItem).replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Stok Etalase:{" "}
                    </span>
                    <span className="font-semibold">
                      {currentItem.displayStock} unit
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Input & Steppers */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="restock-qty" className="font-medium">
                Jumlah Barang Masuk (Unit)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="restock-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))
                  }
                  className="font-mono text-base h-10"
                  required
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Cepat:</span>
                {[10, 25, 50, 100, 200].map((addAmount) => (
                  <Button
                    key={addAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() =>
                      setQuantity((prev) => (prev || 0) + addAmount)
                    }
                  >
                    +{addAmount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Inbound Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="restock-invoice"
                  className="text-xs text-muted-foreground"
                >
                  No. Surat Jalan / Invoice (Opsional)
                </Label>
                <Input
                  id="restock-invoice"
                  placeholder="Contoh: SJ-2026-X19"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="restock-notes"
                  className="text-xs text-muted-foreground"
                >
                  Catatan Supplier / Keterangan (Opsional)
                </Label>
                <Input
                  id="restock-notes"
                  placeholder="Contoh: Pengiriman reguler supplier"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Projection Summary */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2">
              <IconFileText className="size-4 text-muted-foreground" />
              <span>Ringkasan Restock</span>
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">
                  Stok Gudang Sekarang
                </span>
                <span className="font-medium tabular-nums">
                  {currentStock} unit
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50 text-emerald-600 dark:text-emerald-400">
                <span className="font-medium">Tambahan Masuk</span>
                <span className="font-bold tabular-nums">
                  +{quantity || 0} unit
                </span>
              </div>
              <div className="flex items-center justify-between py-2 rounded-lg bg-primary/5 px-3 border border-primary/10">
                <span className="font-semibold text-primary">
                  Stok Akhir Gudang
                </span>
                <span className="font-bold text-base text-primary tabular-nums">
                  {newStockPreview} unit
                </span>
              </div>

              {costPrice > 0 && (
                <div className="pt-2 text-xs text-muted-foreground flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Harga Modal / Unit:</span>
                    <span className="font-mono">{formatIDR(costPrice)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Estimasi Nilai Pasokan:</span>
                    <span className="font-mono">
                      {formatIDR(valuationAddition)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !currentItem}
                className="w-full gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <Spinner className="size-4" />
                ) : (
                  <IconCheck className="size-4" />
                )}
                <span>
                  {isSubmitting ? "Menyimpan..." : "Konfirmasi Restock"}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/stocks")}
                disabled={isSubmitting}
                className="w-full gap-1.5"
              >
                <IconX className="size-4" />
                <span>Batal</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
