import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconArrowsTransferUpDown,
  IconRefresh,
} from "@tabler/icons-react";
import type { WarehouseMovementItem } from "../data/warehouseData";

interface WarehouseMovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movements: WarehouseMovementItem[];
  isLoading?: boolean;
}

export function WarehouseMovementsDialog({
  open,
  onOpenChange,
  movements,
  isLoading,
}: WarehouseMovementsDialogProps) {
  const formatMovementDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const getMovementBadge = (type: WarehouseMovementItem["type"]) => {
    switch (type) {
      case "STOCK_IN":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 gap-1"
          >
            <IconArrowDownLeft className="size-3" />
            <span>Restock Gudang</span>
          </Badge>
        );
      case "TRANSFER":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 gap-1"
          >
            <IconArrowsTransferUpDown className="size-3" />
            <span>Gudang → Etalase</span>
          </Badge>
        );
      case "SALE":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800 gap-1"
          >
            <IconArrowUpRight className="size-3" />
            <span>Penjualan Kasir</span>
          </Badge>
        );
      case "VOID_RETURN":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 gap-1"
          >
            <IconRefresh className="size-3" />
            <span>Retur Void</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Riwayat Mutasi & Pergerakan Stok</DialogTitle>
          <DialogDescription>
            Catatan audit otomatis untuk setiap pasokan barang masuk, transfer
            antar lokasi, dan penjualan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1 mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
              Belum ada pergerakan stok yang tercatat di sistem.
            </div>
          ) : (
            movements.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-xs"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {m.productName}
                    </span>
                    {getMovementBadge(m.type)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Oleh: {m.username || "System"}</span>
                    <span>•</span>
                    <span>{formatMovementDate(m.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        m.type === "STOCK_IN" || m.type === "VOID_RETURN"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {m.type === "STOCK_IN" || m.type === "VOID_RETURN"
                        ? `+${m.quantity}`
                        : `-${m.quantity}`}{" "}
                      unit
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {m.fromLocation && m.toLocation
                        ? `${m.fromLocation} → ${m.toLocation}`
                        : m.toLocation
                          ? `Masuk ke ${m.toLocation}`
                          : `Keluar dari ${m.fromLocation}`}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
