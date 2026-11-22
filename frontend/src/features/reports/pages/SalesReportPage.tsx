import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { SalesReportHeader } from "../components/SalesReportHeader";
import { SalesReportStatsCards } from "../components/SalesReportStatsCards";
import { SalesReportTable } from "../components/SalesReportTable";
import { SalesReportDetailDialog } from "../components/SalesReportDetailDialog";
import { ReconciliationCard } from "../components/ReconciliationCard";
import { useSalesReportData } from "../hooks/useSalesReportData";
import { downloadReportExport } from "../utils/exportReport";
import type { SalesReportItem } from "../data/salesReportData";

export default function SalesReportPage() {
  const { authorizedFetch } = useAuth();
  const { summary, transactions, users, isLoading, isSyncing, error, refetch } =
    useSalesReportData();

  const [selectedTransaction, setSelectedTransaction] =
    React.useState<SalesReportItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleViewDetails = (item: SalesReportItem) => {
    setSelectedTransaction(item);
    setDialogOpen(true);
  };

  const handleExport = async (format: "xlsx" | "csv" = "xlsx") => {
    setIsExporting(true);
    try {
      await downloadReportExport(authorizedFetch, "sales", format);
      toast.add({
        title: `Laporan penjualan berhasil diekspor (${format.toUpperCase()})`,
      });
    } catch (err: any) {
      toast.add({
        title: "Gagal mengekspor laporan",
        description: err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SalesReportHeader
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

      <SalesReportStatsCards summary={summary} isLoading={isLoading} />

      <SalesReportTable
        transactions={transactions}
        users={users}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onExport={() => void handleExport("xlsx")}
      />

      {/* Catatan & Tabel Rekonsiliasi Penjualan Harian vs Shift (T-57) */}
      <div className="px-4 md:px-6">
        <ReconciliationCard />
      </div>

      <SalesReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
}
