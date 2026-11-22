import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { CashierAuditHeader } from "../components/CashierAuditHeader";
import { CashierAuditStatsCards } from "../components/CashierAuditStatsCards";
import { CashierAuditTable } from "../components/CashierAuditTable";
import { CashierAuditDetailDialog } from "../components/CashierAuditDetailDialog";
import { useCashierAuditData } from "../hooks/useCashierAuditData";
import { downloadReportExport } from "../utils/exportReport";
import type { CashierAuditItem } from "../data/cashierAuditData";

export default function CashierAuditPage() {
  const { authorizedFetch } = useAuth();
  const { summary, cashiers, isLoading, isSyncing, error, refetch } =
    useCashierAuditData();

  const [selectedCashier, setSelectedCashier] =
    React.useState<CashierAuditItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleViewDetails = (item: CashierAuditItem) => {
    setSelectedCashier(item);
    setDialogOpen(true);
  };

  const handleExport = async (format: "xlsx" | "csv" = "xlsx") => {
    setIsExporting(true);
    try {
      await downloadReportExport(authorizedFetch, "cashiers", format);
      toast.add({
        title: `Laporan audit kasir berhasil diekspor (${format.toUpperCase()})`,
      });
    } catch (err: any) {
      toast.add({
        title: "Gagal mengekspor laporan audit kasir",
        description: err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <CashierAuditHeader
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

      <CashierAuditStatsCards summary={summary} isLoading={isLoading} />

      <CashierAuditTable
        cashiers={cashiers}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onExport={() => void handleExport("xlsx")}
      />

      <CashierAuditDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cashier={selectedCashier}
      />
    </div>
  );
}
