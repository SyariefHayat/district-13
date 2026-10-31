import * as React from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  IconAlertCircle,
  IconFilter,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useWarehouseData } from "../hooks/useWarehouseData";
import { WarehouseMovementsHeader } from "../components/WarehouseMovementsHeader";
import { WarehouseMovementsStatsCards } from "../components/WarehouseMovementsStatsCards";
import { WarehouseMovementsTable } from "../components/WarehouseMovementsTable";
import type { WarehouseMovementItem } from "../data/warehouseData";

export default function WarehouseMovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterProductId = searchParams.get("productId") || "";

  const { movements, items, isMovementsLoading, fetchMovements, error } =
    useWarehouseData({
      productId: filterProductId || undefined,
      pollIntervalMs: 5000,
    });

  const filteredMovements = React.useMemo(() => {
    if (!filterProductId) return movements;
    return movements.filter(
      (m) =>
        m.productId === filterProductId ||
        items.some(
          (it) =>
            (it.id === filterProductId || it.productId === filterProductId) &&
            it.name.toLowerCase() === m.productName.toLowerCase()
        )
    );
  }, [movements, filterProductId, items]);

  const targetItem = React.useMemo(() => {
    if (!filterProductId) return null;
    return (
      items.find(
        (i) => i.productId === filterProductId || i.id === filterProductId
      ) || null
    );
  }, [filterProductId, items]);

  const handleExport = (list?: WarehouseMovementItem[]) => {
    const listToExport = list && list.length > 0 ? list : filteredMovements;
    if (!listToExport.length) {
      toast.add({ title: "Tidak ada riwayat mutasi untuk diekspor" });
      return;
    }
    const json = JSON.stringify(listToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat-mutasi-${filterProductId ? `${filterProductId}-` : ""}${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} catatan mutasi`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <WarehouseMovementsHeader onExport={() => handleExport()} />

      {/* Error alert */}
      {error && (
        <div className="mx-4 md:mx-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="size-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchMovements()}
            className="gap-1.5"
          >
            <IconRefresh className="size-4" />
            <span>Coba lagi</span>
          </Button>
        </div>
      )}

      {/* Filter by Product Active Banner */}
      {filterProductId && (
        <div className="mx-4 md:mx-6 flex items-center gap-2 p-3 rounded-xl border bg-muted/40 text-sm">
          <IconFilter className="size-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            Menampilkan mutasi khusus produk:
          </span>
          <span className="font-semibold text-foreground">
            {targetItem ? targetItem.name : filterProductId}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              searchParams.delete("productId");
              setSearchParams(searchParams);
            }}
            className="h-7 px-2 text-xs gap-1 ml-auto text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-3.5" />
            <span>Lihat Semua Produk</span>
          </Button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <WarehouseMovementsStatsCards
        movements={filteredMovements}
        isLoading={isMovementsLoading}
      />

      {/* Movements Table */}
      <WarehouseMovementsTable
        movements={filteredMovements}
        items={items}
        isLoading={isMovementsLoading}
        onExport={handleExport}
      />
    </div>
  );
}
