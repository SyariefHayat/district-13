import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowLeft,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconArrowsTransferUpDown,
  IconFilter,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useWarehouseData } from "../hooks/useWarehouseData";
import type { WarehouseMovementItem } from "../data/warehouseData";

export default function WarehouseMovementsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterProductId = searchParams.get("productId") || "";

  const { movements, items, isMovementsLoading, fetchMovements } =
    useWarehouseData();

  const filteredMovements = filterProductId
    ? movements.filter(
        (m) =>
          m.productId === filterProductId ||
          items.some(
            (it) =>
              (it.id === filterProductId || it.productId === filterProductId) &&
              it.name.toLowerCase() === m.productName.toLowerCase()
          )
      )
    : movements;

  const targetItem = filterProductId
    ? items.find(
        (i) => i.productId === filterProductId || i.id === filterProductId
      )
    : null;

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

  const getMovementBadge = (
    type: WarehouseMovementItem["type"],
    toLocation?: string | null
  ) => {
    switch (type) {
      case "STOCK_IN":
        if (toLocation === "DISPLAY") {
          return (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 gap-1"
            >
              <IconArrowDownLeft className="size-3" />
              <span>Restock Etalase</span>
            </Badge>
          );
        }
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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/stocks")}
              className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <IconArrowLeft className="size-4" />
              <span>Kembali</span>
            </Button>
          </div>
          <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            Riwayat Mutasi & Perpindahan Stok
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Catatan log audit otomatis untuk perpindahan inventori, restock, dan
            penjualan kasir.
          </p>
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={() => void fetchMovements()}
          className="gap-1.5 shadow-xs"
        >
          <IconRefresh className="size-4" />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {filterProductId && (
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40 text-sm">
          <IconFilter className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Menampilkan mutasi untuk:
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

      {/* Movement List Container */}
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs p-4 sm:p-6">
        {isMovementsLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground border border-dashed rounded-lg">
            {filterProductId
              ? `Belum ada catatan mutasi untuk produk ini.`
              : `Belum ada catatan mutasi perpindahan stok yang tercatat.`}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMovements.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-lg border border-border/70 bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-foreground truncate">
                      {m.productName}
                    </span>
                    {getMovementBadge(m.type, m.toLocation)}
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
                      className={`text-base font-bold tabular-nums ${
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
                    <span className="text-xs text-muted-foreground block">
                      {m.fromLocation && m.toLocation
                        ? `${m.fromLocation} → ${m.toLocation}`
                        : m.toLocation
                          ? `Masuk ke ${m.toLocation}`
                          : `Keluar dari ${m.fromLocation}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
