import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ProfitReportHeader } from "../components/ProfitReportHeader";
import { ProfitReportStatsCards } from "../components/ProfitReportStatsCards";
import { ProfitReportTable } from "../components/ProfitReportTable";
import { ProfitReportDetailDialog } from "../components/ProfitReportDetailDialog";
import { useProfitReportData } from "../hooks/useProfitReportData";
import type { ProductProfitItem } from "../data/profitReportData";

export default function ProfitReportPage() {
  const { summary, products, categories, isLoading, error, refetch } =
    useProfitReportData();

  const [selectedProduct, setSelectedProduct] =
    React.useState<ProductProfitItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleViewDetails = (item: ProductProfitItem) => {
    setSelectedProduct(item);
    setDialogOpen(true);
  };

  const handleExport = (itemsToExport?: ProductProfitItem[]) => {
    const list =
      itemsToExport && itemsToExport.length > 0 ? itemsToExport : products;

    if (!list.length) {
      toast.add({
        title: "Tidak ada data profit untuk diekspor",
      });
      return;
    }

    const exportRows = list.map((item) => ({
      Produk: item.name,
      SKU: item.sku,
      Kategori: item.category,
      "Terjual (pcs)": item.unitsSold,
      "Harga Jual": item.sellingPrice,
      "Modal HPP": item.costPrice,
      "Total Omzet": item.totalRevenue,
      "Total HPP": item.totalCogs,
      "Laba Kotor": item.grossProfit,
      "Margin (%)": `${item.profitMargin}%`,
    }));

    const json = JSON.stringify(exportRows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-profit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${list.length} data profit produk`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ProfitReportHeader onExport={() => handleExport()} />

      {error && (
        <div className="mx-4 md:mx-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="size-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-1.5"
          >
            <IconRefresh className="size-4" />
            <span>Coba lagi</span>
          </Button>
        </div>
      )}

      <ProfitReportStatsCards summary={summary} isLoading={isLoading} />

      <ProfitReportTable
        products={products}
        categories={categories}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onExport={handleExport}
      />

      <ProfitReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
}
