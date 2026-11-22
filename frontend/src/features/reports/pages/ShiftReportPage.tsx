import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { ShiftReportHeader } from "../components/ShiftReportHeader";
import { ShiftReportStatsCards } from "../components/ShiftReportStatsCards";
import { ShiftReportTable } from "../components/ShiftReportTable";
import { ShiftReportDetailDialog } from "../components/ShiftReportDetailDialog";
import { useShiftReportData } from "../hooks/useShiftReportData";
import { downloadReportExport } from "../utils/exportReport";
import type { ShiftReportItem } from "../data/shiftReportData";

export default function ShiftReportPage() {
  const { authorizedFetch } = useAuth();
  const { summary, shifts, users, isLoading, isSyncing, error, refetch } =
    useShiftReportData();

  const [selectedShift, setSelectedShift] =
    React.useState<ShiftReportItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleViewDetails = (shift: ShiftReportItem) => {
    setSelectedShift(shift);
    setDialogOpen(true);
  };

  const handleExport = async (format: "xlsx" | "csv" = "xlsx") => {
    setIsExporting(true);
    try {
      await downloadReportExport(authorizedFetch, "shifts", format);
      toast.add({
        title: `Laporan shift berhasil diekspor (${format.toUpperCase()})`,
      });
    } catch (err: any) {
      toast.add({
        title: "Gagal mengekspor laporan shift",
        description: err.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ShiftReportHeader
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

      <ShiftReportStatsCards summary={summary} isLoading={isLoading} />

      <ShiftReportTable
        shifts={shifts}
        users={users}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onExport={() => void handleExport("xlsx")}
      />

      <ShiftReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shift={selectedShift}
      />
    </div>
  );
}
