import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PaymentHeader } from "../components/PaymentHeader";
import { PaymentStatsCards } from "../components/PaymentStatsCards";
import { PaymentTable } from "../components/PaymentTable";
import { PaymentFormDialog } from "../components/PaymentFormDialog";
import { PaymentDetailDialog } from "../components/PaymentDetailDialog";
import { usePaymentData } from "../hooks/usePaymentData";
import type { PaymentMethodItem } from "../data/paymentData";

export default function PaymentPage() {
  const {
    payments,
    isLoading,
    error,
    refetch,
    toggleStatus,
    deletePayment,
    deleteMultiple,
    createPayment,
    updatePayment,
  } = usePaymentData();

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingPayment, setEditingPayment] =
    React.useState<PaymentMethodItem | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] =
    React.useState<PaymentMethodItem | null>(null);

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (payment: PaymentMethodItem) => {
    setEditingPayment(payment);
    setFormDialogOpen(true);
  };

  const handleOpenDetail = (payment: PaymentMethodItem) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const handleExport = (selectedPayments?: PaymentMethodItem[]) => {
    const listToExport =
      selectedPayments && selectedPayments.length > 0
        ? selectedPayments
        : payments;

    if (!listToExport.length) {
      toast.add({ title: "Tidak ada data pembayaran untuk diekspor" });
      return;
    }
    const json = JSON.stringify(listToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-methods-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} metode pembayaran`,
    });
  };

  const handleFormSubmit = async (values: any) => {
    if (editingPayment) {
      return await updatePayment(editingPayment.id, values);
    } else {
      return await createPayment(values);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <PaymentHeader
        onExport={() => handleExport()}
        onAddPayment={handleOpenAdd}
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

      <PaymentStatsCards payments={payments} isLoading={isLoading} />

      <PaymentTable
        payments={payments}
        isLoading={isLoading}
        onToggleStatus={toggleStatus}
        onDeletePayment={deletePayment}
        onDeleteMultiple={deleteMultiple}
        onViewDetails={handleOpenDetail}
        onEditPayment={handleOpenEdit}
        onExport={handleExport}
      />

      <PaymentFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        payment={editingPayment}
        onSubmit={handleFormSubmit}
      />

      <PaymentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        payment={selectedPayment}
      />
    </div>
  );
}
