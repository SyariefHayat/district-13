import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { CashReportHeader } from "../components/CashReportHeader";
import { CashReportStatsCards } from "../components/CashReportStatsCards";
import { CashReportTable } from "../components/CashReportTable";
import { CashReportDetailDialog } from "../components/CashReportDetailDialog";
import { useCashReportData } from "../hooks/useCashReportData";
import { downloadReportExport } from "../utils/exportReport";
import type { CashMovementItem } from "../data/cashReportData";

export default function CashReportPage() {
  const { authorizedFetch } = useAuth();
  const { summary, movements, users, isLoading, isSyncing, error, refetch } =
    useCashReportData();

  const [selectedMovement, setSelectedMovement] =
    React.useState<CashMovementItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleViewDetails = (item: CashMovementItem) => {
    setSelectedMovement(item);
    setDialogOpen(true);
  };

  const handleExport = async (format: "xlsx" | "csv" = "xlsx") => {
    setIsExporting(true);
    try {
      await downloadReportExport(authorizedFetch, "cash", format);
      toast.add({
        title: `Laporan arus kas berhasil diekspor (${format.toUpperCase()})`,
      });
    } catch (err: any) {
      toast.add({
        title: "Gagal mengekspor laporan arus kas",
        description: err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <CashReportHeader
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

      <CashReportStatsCards summary={summary} isLoading={isLoading} />

      <CashReportTable
        movements={movements}
        users={users}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onExport={() => void handleExport("xlsx")}
      />

      <CashReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movement={selectedMovement}
      />
    </div>
  );
}
