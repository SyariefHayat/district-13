import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ShiftReportHeader } from "../components/ShiftReportHeader";
import { ShiftReportStatsCards } from "../components/ShiftReportStatsCards";
import { ShiftReportTable } from "../components/ShiftReportTable";
import { ShiftReportDetailDialog } from "../components/ShiftReportDetailDialog";
import { useShiftReportData } from "../hooks/useShiftReportData";
import type { ShiftReportItem } from "../data/shiftReportData";

export default function ShiftReportPage() {
  const { summary, shifts, users, isLoading, isSyncing, error, refetch } =
    useShiftReportData();

  const [selectedShift, setSelectedShift] =
    React.useState<ShiftReportItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleViewDetails = (shift: ShiftReportItem) => {
    setSelectedShift(shift);
    setDialogOpen(true);
  };

  const handleExport = (itemsToExport?: ShiftReportItem[]) => {
    const list =
      itemsToExport && itemsToExport.length > 0 ? itemsToExport : shifts;

    if (!list.length) {
      toast.add({
        title: "Tidak ada data shift untuk diekspor",
      });
      return;
    }

    const exportRows = list.map((item) => ({
      Kasir: item.cashierName || item.username,
      Username: item.username,
      "Waktu Buka": item.openedAt,
      "Waktu Tutup": item.closedAt || "Sedang Berjalan",
      "Total Transaksi": item.transactionCount,
      "Modal Awal": item.openingCash,
      "Kas Sistem": item.expectedCash,
      "Kas Akhir": item.closingCash ?? "-",
      "Selisih Kas": item.cashDifference ?? "-",
      Status: item.status === "OPEN" ? "Aktif" : "Selesai",
    }));

    const json = JSON.stringify(exportRows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-shift-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${list.length} data shift`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ShiftReportHeader
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

      <ShiftReportStatsCards summary={summary} isLoading={isLoading} />

      <ShiftReportTable
        shifts={shifts}
        users={users}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onExport={handleExport}
      />

      <ShiftReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shift={selectedShift}
      />
    </div>
  );
}
