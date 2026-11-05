import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { SalesReportHeader } from "../components/SalesReportHeader";
import { SalesReportStatsCards } from "../components/SalesReportStatsCards";
import { SalesReportTable } from "../components/SalesReportTable";
import { SalesReportDetailDialog } from "../components/SalesReportDetailDialog";
import { useSalesReportData } from "../hooks/useSalesReportData";
import type { SalesReportItem } from "../data/salesReportData";

export default function SalesReportPage() {
  const { summary, transactions, users, isLoading, error, refetch } =
    useSalesReportData();

  const [selectedTransaction, setSelectedTransaction] =
    React.useState<SalesReportItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleViewDetails = (item: SalesReportItem) => {
    setSelectedTransaction(item);
    setDialogOpen(true);
  };

  const handleExport = (itemsToExport?: SalesReportItem[]) => {
    const list =
      itemsToExport && itemsToExport.length > 0 ? itemsToExport : transactions;

    if (!list.length) {
      toast.add({
        title: "Tidak ada data penjualan untuk diekspor",
      });
      return;
    }

    const exportRows = list.map((item) => ({
      "No. Transaksi": item.transactionNumber,
      Waktu: item.createdAt,
      Kasir: item.cashierName || "-",
      "Metode Pembayaran": item.paymentMethod,
      "Subtotal (Gross)": item.subtotalAmount,
      Diskon: item.discountAmount,
      "Total Bersih (Net)": item.totalAmount,
      "Nominal Bayar": item.paidAmount,
      Kembalian: item.changeAmount,
      Status: item.status,
    }));

    const json = JSON.stringify(exportRows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-penjualan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${list.length} data transaksi`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SalesReportHeader onExport={() => handleExport()} />

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
        onExport={handleExport}
      />

      <SalesReportDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
}
