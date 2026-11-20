import * as React from "react";
import { IconAlertTriangle, IconCheck, IconRefresh } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";

export interface ReviewFlagItem {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string | null;
  warehouseQty: number;
  displayQty: number;
  deficit: number;
  needsReview: boolean;
  updatedAt: string;
}

interface WarehouseReviewFlagsSectionProps {
  onResolved?: () => void;
}

export function WarehouseReviewFlagsSection({
  onResolved,
}: WarehouseReviewFlagsSectionProps) {
  const { authorizedFetch } = useAuth();
  const [items, setItems] = React.useState<ReviewFlagItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Resolve dialog state
  const [resolvingItem, setResolvingItem] =
    React.useState<ReviewFlagItem | null>(null);
  const [targetDisplayStock, setTargetDisplayStock] = React.useState<number>(0);
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resolveError, setResolveError] = React.useState<string | null>(null);

  const fetchReviewFlags = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authorizedFetch("/inventory/review-flags");
      if (!res.ok) {
        throw new Error(`Gagal memuat tinjauan stok (${res.status})`);
      }
      const data = (await res.json()) as ReviewFlagItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [authorizedFetch]);

  React.useEffect(() => {
    void fetchReviewFlags();
  }, [fetchReviewFlags]);

  const handleOpenResolve = (item: ReviewFlagItem) => {
    setResolvingItem(item);
    setTargetDisplayStock(0);
    setNotes("Rekonsiliasi stok offline diselesaikan");
    setResolveError(null);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItem) return;

    try {
      setIsSubmitting(true);
      setResolveError(null);

      const res = await authorizedFetch(
        `/inventory/review-flags/${resolvingItem.productId}/resolve`,
        {
          method: "POST",
          body: JSON.stringify({
            targetDisplayStock: Math.max(0, Math.floor(targetDisplayStock)),
            notes: notes.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.message || `Gagal menyelesaikan tinjauan (${res.status})`
        );
      }

      toast.add({
        title: "Tinjauan stok berhasil diselesaikan",
        description: `Stok etalase ${resolvingItem.productName} diatur ke ${targetDisplayStock}.`,
      });

      setResolvingItem(null);
      void fetchReviewFlags();
      onResolved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setResolveError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="mx-4 md:mx-6 rounded-xl border p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>Memeriksa status tinjauan stok negatif...</span>
      </div>
    );
  }

  if (items.length === 0 && !error) {
    return null;
  }

  return (
    <div className="mx-4 md:mx-6 space-y-4">
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <IconAlertTriangle className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Tinjauan Stok Negatif & Offline (OFF-008)</span>
                  <Badge variant="destructive" className="px-2 py-0 text-xs">
                    {items.length} Perlu Review
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Produk dengan stok minus akibat penjualan saat offline. Harap
                  periksa fisik etalase dan selesaikan tinjauan.
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchReviewFlags()}
              className="gap-1.5 h-8 text-xs shrink-0"
              disabled={isLoading}
            >
              <IconRefresh
                className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Segarkan</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {error && (
            <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border bg-background overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-medium text-xs">Produk</TableHead>
                  <TableHead className="font-medium text-xs">
                    Kategori
                  </TableHead>
                  <TableHead className="font-medium text-xs text-right">
                    Stok Gudang
                  </TableHead>
                  <TableHead className="font-medium text-xs text-right">
                    Stok Etalase
                  </TableHead>
                  <TableHead className="font-medium text-xs text-right">
                    Defisit
                  </TableHead>
                  <TableHead className="font-medium text-xs text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.productId} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                          {row.productName}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {row.sku}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {row.categoryName || "-"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-mono text-xs">
                      {row.warehouseQty}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          row.displayQty < 0
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                      >
                        {row.displayQty}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Badge
                        variant="destructive"
                        className="font-mono text-xs px-2 py-0"
                      >
                        -{row.deficit}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleOpenResolve(row)}
                      >
                        <IconCheck className="size-3.5" />
                        <span>Selesaikan</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog
        open={!!resolvingItem}
        onOpenChange={(open) => !open && setResolvingItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selesaikan Tinjauan Stok (OFF-008)</DialogTitle>
            <DialogDescription>
              Rekonsiliasi stok etalase fisik untuk produk yang terjual secara
              offline.
            </DialogDescription>
          </DialogHeader>

          {resolvingItem && (
            <form onSubmit={handleResolveSubmit} className="space-y-4 pt-2">
              {resolveError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
                  {resolveError}
                </div>
              )}

              <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
                <div className="font-medium text-sm text-foreground">
                  {resolvingItem.productName}
                </div>
                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>
                    SKU:{" "}
                    <strong className="font-mono text-foreground">
                      {resolvingItem.sku}
                    </strong>
                  </span>
                  <span>
                    Etalase Saat Ini:{" "}
                    <strong className="text-destructive font-mono">
                      {resolvingItem.displayQty}
                    </strong>
                  </span>
                  <span>
                    Defisit:{" "}
                    <strong className="text-destructive font-mono">
                      -{resolvingItem.deficit}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target-display-stock">
                  Stok Fisik Etalase Nyata Saat Ini
                </Label>
                <Input
                  id="target-display-stock"
                  type="number"
                  min={0}
                  value={targetDisplayStock}
                  onChange={(e) =>
                    setTargetDisplayStock(Number(e.target.value))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan jumlah riil barang yang sekarang ada di etalase/rak
                  (minimal 0).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="resolve-notes">Catatan Rekonsiliasi</Label>
                <Input
                  id="resolve-notes"
                  placeholder="Contoh: Stok dihitung ulang, fisik ada 5 pcs"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={255}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResolvingItem(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="size-4 mr-2" />
                      Memproses...
                    </>
                  ) : (
                    "Konfirmasi & Selesaikan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
