import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CashReportHeader } from "../components/CashReportHeader";
import { CashReportStatsCards } from "../components/CashReportStatsCards";
import { CashReportTable } from "../components/CashReportTable";
import { CashReportDetailDialog } from "../components/CashReportDetailDialog";
import { useCashReportData } from "../hooks/useCashReportData";
import type { CashMovementItem } from "../data/cashReportData";

export default function CashReportPage() {
  const { summary, movements, users, isLoading, isSyncing, error, refetch } =
    useCashReportData();

  const [selectedMovement, setSelectedMovement] =
    React.useState<CashMovementItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleViewDetails = (item: CashMovementItem) => {
    setSelectedMovement(item);
    setDialogOpen(true);
  };

  const handleExport = (itemsToExport?: CashMovementItem[]) => {
    const list =
      itemsToExport && itemsToExport.length > 0 ? itemsToExport : movements;

    if (!list.length) {
      toast.add({
        title: "Tidak ada data mutasi kas untuk diekspor",
      });
      return;
    }

    const exportRows = list.map((item) => ({
      ID: item.id,
      Waktu: item.createdAt,
      Tipe: item.type === "IN" ? "Kas Masuk" : "Kas Keluar",
      Keterangan: item.description,
      Petugas: item.recordedByName || item.recordedBy,
      Nominal: item.amount,
      Shift: item.shiftId,
    }));

    const json = JSON.stringify(exportRows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-kas-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${list.length} data mutasi kas`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <CashReportHeader
        onExport={() => handleExport()}
        onRefresh={() => void refetch()}
        isRefreshing={isSyncing}
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
        onExport={handleExport}
      />

      <CashReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movement={selectedMovement}
      />
    </div>
  );
}
