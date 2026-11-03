import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { DiscountHeader } from "../components/DiscountHeader";
import { DiscountStatsCards } from "../components/DiscountStatsCards";
import { DiscountTable } from "../components/DiscountTable";
import { DiscountFormDialog } from "../components/DiscountFormDialog";
import { useDiscountData } from "../hooks/useDiscountData";
import type { DiscountItem } from "../data/discountData";

export default function DiscountPage() {
  const {
    discounts,
    isLoading,
    error,
    refetch,
    toggleStatus,
    deleteDiscount,
    deleteMultiple,
    createDiscount,
    updateDiscount,
  } = useDiscountData();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] =
    React.useState<DiscountItem | null>(null);

  const handleOpenAdd = () => {
    setEditingDiscount(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (discount: DiscountItem) => {
    setEditingDiscount(discount);
    setDialogOpen(true);
  };

  const handleExport = (selectedDiscounts?: DiscountItem[]) => {
    const listToExport =
      selectedDiscounts && selectedDiscounts.length > 0
        ? selectedDiscounts
        : discounts;

    if (!listToExport.length) {
      toast.add({ title: "Tidak ada diskon untuk diekspor" });
      return;
    }

    const json = JSON.stringify(listToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discounts-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} diskon`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <DiscountHeader
        onAddDiscount={handleOpenAdd}
        onExport={() => handleExport()}
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

      <DiscountStatsCards discounts={discounts} isLoading={isLoading} />
      <DiscountTable
        discounts={discounts}
        isLoading={isLoading}
        onToggleStatus={toggleStatus}
        onEditDiscount={handleOpenEdit}
        onDeleteDiscount={deleteDiscount}
        onDeleteMultiple={deleteMultiple}
        onExport={handleExport}
      />

      <DiscountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        discount={editingDiscount}
        onSubmit={async (values) => {
          if (editingDiscount) {
            return await updateDiscount(editingDiscount.id, values);
          } else {
            return await createDiscount(values);
          }
        }}
      />
    </div>
  );
}
