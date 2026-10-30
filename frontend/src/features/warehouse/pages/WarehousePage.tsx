import * as React from "react";
import { useNavigate } from "react-router";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { WarehouseHeader } from "../components/WarehouseHeader";
import { WarehouseStatsCards } from "../components/WarehouseStatsCards";
import { WarehouseTable } from "../components/WarehouseTable";
import { useWarehouseData } from "../hooks/useWarehouseData";
import type { WarehouseInventoryItem } from "../data/warehouseData";

export default function WarehousePage() {
  const navigate = useNavigate();
  const { items, categories, isLoading, error, refetch } = useWarehouseData();

  const handleOpenRestock = (item?: WarehouseInventoryItem) => {
    if (item) {
      navigate(
        `/dashboard/stocks/restock?productId=${item.productId || item.id}`
      );
    } else {
      navigate("/dashboard/stocks/restock");
    }
  };

  const handleOpenTransfer = (item?: WarehouseInventoryItem) => {
    if (item) {
      navigate(
        `/dashboard/stocks/transfer?productId=${item.productId || item.id}`
      );
    } else {
      navigate("/dashboard/stocks/transfer");
    }
  };

  const handleOpenMovements = (item?: WarehouseInventoryItem) => {
    if (item) {
      navigate(
        `/dashboard/stocks/movements?productId=${item.productId || item.id}`
      );
    } else {
      navigate("/dashboard/stocks/movements");
    }
  };

  const handleExport = (selectedItems?: WarehouseInventoryItem[]) => {
    const listToExport =
      selectedItems && selectedItems.length > 0 ? selectedItems : items;
    if (!listToExport.length) {
      toast.add({ title: "Tidak ada data inventori untuk diekspor" });
      return;
    }
    const json = JSON.stringify(listToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warehouse-stock-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} data stok gudang`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <WarehouseHeader
        onExport={() => handleExport()}
        onRestock={() => handleOpenRestock()}
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

      <WarehouseStatsCards items={items} isLoading={isLoading} />

      <WarehouseTable
        items={items}
        categories={categories}
        isLoading={isLoading}
        onOpenRestock={handleOpenRestock}
        onOpenTransfer={handleOpenTransfer}
        onViewMovements={handleOpenMovements}
        onExport={handleExport}
      />
    </div>
  );
}
