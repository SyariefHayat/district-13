import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { ProfitReportHeader } from "../components/ProfitReportHeader";
import { ProfitReportStatsCards } from "../components/ProfitReportStatsCards";
import { ProfitReportTable } from "../components/ProfitReportTable";
import { ProfitReportDetailDialog } from "../components/ProfitReportDetailDialog";
import { useProfitReportData } from "../hooks/useProfitReportData";
import { downloadReportExport } from "../utils/exportReport";
import type { ProductProfitItem } from "../data/profitReportData";

export default function ProfitReportPage() {
  const { authorizedFetch } = useAuth();
  const {
    summary,
    products,
    categories,
    isLoading,
    isSyncing,
    error,
    refetch,
  } = useProfitReportData();

  const [selectedProduct, setSelectedProduct] =
    React.useState<ProductProfitItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleViewDetails = (item: ProductProfitItem) => {
    setSelectedProduct(item);
    setDialogOpen(true);
  };

  const handleExport = async (format: "xlsx" | "csv" = "xlsx") => {
    setIsExporting(true);
    try {
      await downloadReportExport(authorizedFetch, "profit", format);
      toast.add({
        title: `Laporan analitik profit berhasil diekspor (${format.toUpperCase()})`,
      });
    } catch (err: any) {
      toast.add({
        title: "Gagal mengekspor laporan analitik profit",
        description: err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ProfitReportHeader
        onExport={handleExport}
        onRefresh={() => void refetch()}
        isRefreshing={isSyncing}
        isExporting={isExporting}
      />

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
        onExport={() => void handleExport("xlsx")}
      />

      <ProfitReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
}
