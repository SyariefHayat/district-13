import {
  IconChartPie,
  IconPercentage,
  IconPrinter,
  IconReceiptTax,
  IconTag,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatIDR } from "../data/salesReportData";
import { type ProductProfitItem } from "../data/profitReportData";

interface ProfitReportDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductProfitItem | null;
}

export function ProfitReportDetailDialog({
  open,
  onOpenChange,
  product,
}: ProfitReportDetailDialogProps) {
  if (!product) return null;

  const profitPerUnit = product.sellingPrice - product.costPrice;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <IconTrendingUp className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Rincian Profitabilitas Produk
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  {product.sku}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`gap-1 px-2.5 py-0.5 font-semibold ${
                product.profitMargin >= 60
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : product.profitMargin >= 40
                    ? "border-blue-500/40 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              Margin {product.profitMargin}%
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <IconTag className="size-3.5 text-slate-400 shrink-0" />
              <span>Produk: {product.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconChartPie className="size-3.5 text-slate-400 shrink-0" />
              <span>Kategori: {product.category}</span>
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Harga Jual per Unit</span>
              <span className="font-medium text-foreground">
                {formatIDR(product.sellingPrice)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <IconReceiptTax className="size-3.5" />
                <span>Modal (HPP) per Unit</span>
              </span>
              <span className="text-muted-foreground">
                {formatIDR(product.costPrice)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Laba per Unit</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                +{formatIDR(profitPerUnit)}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Total Volume Terjual</span>
              <span className="font-medium text-foreground">
                {product.unitsSold.toLocaleString("id-ID")} pcs
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <IconWallet className="size-3.5" />
                <span>Total Omzet Penjualan</span>
              </span>
              <span className="font-medium text-foreground">
                {formatIDR(product.totalRevenue)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <IconReceiptTax className="size-3.5" />
                <span>Total Modal Pokok (COGS)</span>
              </span>
              <span className="text-muted-foreground">
                {formatIDR(product.totalCogs)}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center text-base font-semibold text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5">
                <IconTrendingUp className="size-4 text-emerald-500" />
                <span>Total Laba Kotor</span>
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatIDR(product.grossProfit)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <IconPercentage className="size-3.5" />
                <span>Persentase Margin Profit</span>
              </span>
              <span className="font-bold text-foreground">
                {product.profitMargin}%
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50 dark:bg-slate-900/40 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <IconPrinter className="size-4" />
            <span>Cetak Bukti</span>
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
