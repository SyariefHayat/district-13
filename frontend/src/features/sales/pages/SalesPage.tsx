import * as React from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { toast } from "@/components/ui/toast";
import { SalesHeader } from "../components/SalesHeader";
import { SalesStatsCards } from "../components/SalesStatsCards";
import { SalesTable } from "../components/SalesTable";
import { SaleDetailDialog } from "../components/SaleDetailDialog";
import { VoidSaleDialog } from "../components/VoidSaleDialog";
import { useSalesData } from "../hooks/useSalesData";
import type { SaleTransaction } from "../data/salesData";

export default function SalesPage() {
  const {
    transactions,
    isLoading,
    error,
    getTransactionDetail,
    voidTransaction,
  } = useSalesData();

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<SaleTransaction | null>(
    null
  );

  const [voidDialogOpen, setVoidDialogOpen] = React.useState(false);
  const [txToVoid, setTxToVoid] = React.useState<SaleTransaction | null>(null);

  const handleOpenDetail = async (tx: SaleTransaction) => {
    setSelectedTx(tx);
    setDetailDialogOpen(true);
    const full = await getTransactionDetail(tx.id);
    if (full) {
      setSelectedTx(full);
    }
  };

  const handleOpenVoid = (tx: SaleTransaction) => {
    setTxToVoid(tx);
    setVoidDialogOpen(true);
  };

  const handleExport = (selectedTxs?: SaleTransaction[]) => {
    const listToExport =
      selectedTxs && selectedTxs.length > 0 ? selectedTxs : transactions;

    if (!listToExport.length) {
      toast.add({ title: "Tidak ada data transaksi untuk diekspor" });
      return;
    }

    const exportData = listToExport.map((t) => ({
      "No. Transaksi": t.transactionNumber,
      Waktu: t.createdAt,
      Kasir: t.cashierName || "-",
      "Metode Pembayaran": t.paymentMethod,
      Subtotal: t.subtotalAmount,
      Diskon: t.discountAmount,
      Total: t.totalAmount,
      "Nominal Bayar": t.paidAmount,
      Kembalian: t.changeAmount,
      Status: t.status,
      "Alasan Void": t.voidReason || "-",
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} transaksi`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SalesHeader onExport={() => handleExport()} />

      {error && (
        <div className="mx-4 md:mx-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
          <IconAlertCircle className="size-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <SalesStatsCards transactions={transactions} isLoading={isLoading} />

      <SalesTable
        transactions={transactions}
        isLoading={isLoading}
        onViewDetail={handleOpenDetail}
        onVoidClick={handleOpenVoid}
        onExport={handleExport}
      />

      <SaleDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        transaction={selectedTx}
        onVoidClick={handleOpenVoid}
      />

      <VoidSaleDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        transaction={txToVoid}
        onConfirm={voidTransaction}
      />
    </div>
  );
}
