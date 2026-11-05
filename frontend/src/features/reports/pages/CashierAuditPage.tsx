import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CashierAuditHeader } from "../components/CashierAuditHeader";
import { CashierAuditStatsCards } from "../components/CashierAuditStatsCards";
import { CashierAuditTable } from "../components/CashierAuditTable";
import { CashierAuditDetailDialog } from "../components/CashierAuditDetailDialog";
import { useCashierAuditData } from "../hooks/useCashierAuditData";
import type { CashierAuditItem } from "../data/cashierAuditData";

export default function CashierAuditPage() {
  const { summary, cashiers, isLoading, error, refetch } =
    useCashierAuditData();

  const [selectedCashier, setSelectedCashier] =
    React.useState<CashierAuditItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleViewDetails = (item: CashierAuditItem) => {
    setSelectedCashier(item);
    setDialogOpen(true);
  };

  const handleExport = (itemsToExport?: CashierAuditItem[]) => {
    const list =
      itemsToExport && itemsToExport.length > 0 ? itemsToExport : cashiers;

    if (!list.length) {
      toast.add({
        title: "Tidak ada data audit kasir untuk diekspor",
      });
      return;
    }

    const exportRows = list.map((item) => ({
      "Nama Kasir": item.cashierName,
      "Kode Kasir": item.cashierCode,
      Jabatan: item.role,
      "Total Shift": item.totalShifts,
      "Total Transaksi": item.totalTransactions,
      "Total Penjualan": item.totalSales,
      "Kas Diharapkan": item.cashExpected,
      "Kas Aktual": item.cashActual,
      "Selisih Kas": item.cashDifference,
      "Akurasi Rekonsiliasi": `${item.accuracyRate}%`,
      "Jumlah Void": item.voidCount,
      "Nominal Void": item.voidAmount,
      "Diskon Diberikan": item.discountAmount,
      Status: item.auditStatus,
      "Tanggal Audit": item.lastAuditDate,
      Catatan: item.notes || "-",
    }));

    const json = JSON.stringify(exportRows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-kasir-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${list.length} data audit kasir`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <CashierAuditHeader onExport={() => handleExport()} />

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
        onExport={handleExport}
      />

      <CashierAuditDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cashier={selectedCashier}
      />
    </div>
  );
}
