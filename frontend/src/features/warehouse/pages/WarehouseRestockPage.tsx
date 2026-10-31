import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  IconBuildingStore,
  IconBuildingWarehouse,
  IconCheck,
  IconChevronLeft,
  IconX,
} from "@tabler/icons-react";
import { cn } from "cn";
import { useWarehouseData } from "../hooks/useWarehouseData";
import { formatIDR, getWarehouseStockStatus } from "../data/warehouseData";

export default function WarehouseRestockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";

  const { items, isLoading, restock } = useWarehouseData();

  const [selectedProductId, setSelectedProductId] =
    React.useState<string>(initialProductId);
  const [targetLocation, setTargetLocation] = React.useState<
    "WAREHOUSE" | "DISPLAY"
  >("WAREHOUSE");
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

  const productSelectItems = React.useMemo(() => {
    return items.map((item) => ({
      label: `${item.name} (${item.sku})`,
      value: item.productId || item.id,
    }));
  }, [items]);

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
      const success = await restock(
        currentItem.productId,
        quantity,
        targetLocation
      );
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

  const currentWhStock = currentItem?.warehouseStock ?? 0;
  const currentDispStock = currentItem?.displayStock ?? 0;
  const newWhStockPreview =
    targetLocation === "WAREHOUSE"
      ? currentWhStock + (quantity || 0)
      : currentWhStock;
  const newDispStockPreview =
    targetLocation === "DISPLAY"
      ? currentDispStock + (quantity || 0)
      : currentDispStock;

  const costPrice = currentItem?.costPrice ?? 0;
  const valuationAddition = (quantity || 0) * costPrice;

  return (
    <div className="p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2">
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
              <span>
                {isSubmitting ? "Menyimpan..." : "Konfirmasi Restock"}
              </span>
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
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* LEFT COLUMN: Detail Barang, Target Lokasi & Kuantitas (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detail Produk & Pasokan</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Product Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="restock-product"
                    className="text-xs md:text-sm font-medium"
                  >
                    Pilih Produk <span className="text-destructive">*</span>
                  </Label>
                  {isLoading ? (
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  ) : (
                    <Select
                      items={productSelectItems}
                      value={selectedProductId}
                      onValueChange={(val) => {
                        if (val) setSelectedProductId(val);
                      }}
                    >
                      <SelectTrigger id="restock-product" className="w-full">
                        <SelectValue placeholder="Pilih produk untuk di-restock">
                          {currentItem
                            ? `${currentItem.name} (${currentItem.sku})`
                            : undefined}
                        </SelectValue>
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
                                {item.sku} (Gudang: {item.warehouseStock},
                                Etalase: {item.displayStock})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Selected Product Summary Card */}
                {currentItem && (
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-muted-foreground border border-border/80">
                        {currentItem.image ? (
                          <img
                            src={currentItem.image}
                            alt={currentItem.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <IconBuildingWarehouse className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground text-sm truncate">
                            {currentItem.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize font-medium shrink-0"
                          >
                            {getWarehouseStockStatus(currentItem).replace(
                              "_",
                              " "
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                          <span className="font-mono">{currentItem.sku}</span>
                          <span>•</span>
                          <span>{currentItem.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/50">
                        <span className="text-muted-foreground">
                          Stok Gudang:
                        </span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {currentItem.warehouseStock} unit
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/50">
                        <span className="text-muted-foreground">
                          Stok Etalase:
                        </span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {currentItem.displayStock} unit
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Destination Location */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs md:text-sm font-medium">
                    Target Lokasi Penerimaan{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTargetLocation("WAREHOUSE")}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                        targetLocation === "WAREHOUSE"
                          ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground"
                          : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          targetLocation === "WAREHOUSE"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <IconBuildingWarehouse className="size-4" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        Gudang Utama (Warehouse)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetLocation("DISPLAY")}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                        targetLocation === "DISPLAY"
                          ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500 text-foreground"
                          : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          targetLocation === "DISPLAY"
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <IconBuildingStore className="size-4" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        Etalase Toko (Display)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quantity Input & Stepper Buttons */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="restock-qty"
                      className="text-xs md:text-sm font-medium"
                    >
                      Jumlah Barang Masuk (Unit){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  <Input
                    id="restock-qty"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(1, parseInt(e.target.value, 10) || 0)
                      )
                    }
                    className="font-mono text-base h-10"
                    required
                  />

                  {/* Quick Increment Stepper Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">
                      Tambah cepat:
                    </span>
                    {[10, 25, 50, 100, 200].map((addAmount) => (
                      <Button
                        key={addAmount}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs rounded-md"
                        onClick={() =>
                          setQuantity((prev) => (prev || 0) + addAmount)
                        }
                      >
                        +{addAmount}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Dokumen & Pengiriman */}
            <Card>
              <CardHeader>
                <CardTitle>Dokumen & Pengiriman</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="restock-invoice"
                      className="text-xs md:text-sm font-medium"
                    >
                      No. Surat Jalan / Invoice
                    </Label>
                    <Input
                      id="restock-invoice"
                      placeholder="Contoh: SJ-2026-X19"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="restock-notes"
                      className="text-xs md:text-sm font-medium"
                    >
                      Keterangan / Catatan Supplier
                    </Label>
                    <Input
                      id="restock-notes"
                      placeholder="Contoh: Kiriman mingguan reguler"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Restock</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">
                      Stok {targetLocation === "DISPLAY" ? "Etalase" : "Gudang"}{" "}
                      Saat Ini
                    </span>
                    <span className="font-medium tabular-nums">
                      {targetLocation === "DISPLAY"
                        ? currentDispStock
                        : currentWhStock}{" "}
                      unit
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50 text-emerald-600 dark:text-emerald-400">
                    <span className="font-medium">Tambahan Masuk</span>
                    <span className="font-bold tabular-nums">
                      +{quantity || 0} unit
                    </span>
                  </div>

                  {/* Summary Pill: Total Stok Akhir */}
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      Stok Akhir{" "}
                      {targetLocation === "DISPLAY" ? "Etalase" : "Gudang"}:
                    </span>
                    <span className="font-bold text-sm text-primary tabular-nums">
                      {targetLocation === "DISPLAY"
                        ? newDispStockPreview
                        : newWhStockPreview}{" "}
                      unit
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span>Total Fisik Keseluruhan:</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {newWhStockPreview + newDispStockPreview} unit
                    </span>
                  </div>

                  {costPrice > 0 && (
                    <div className="pt-2 text-xs text-muted-foreground flex flex-col gap-1.5 border-t border-border/50">
                      <div className="flex justify-between">
                        <span>Harga Modal / Unit:</span>
                        <span className="font-mono">
                          {formatIDR(costPrice)}
                        </span>
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
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
