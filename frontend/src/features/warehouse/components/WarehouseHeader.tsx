import { Button } from "@/components/ui/button";
import { IconAdjustments, IconDownload, IconPlus } from "@tabler/icons-react";

interface WarehouseHeaderProps {
  title?: string;
  description?: string;
  isOwner?: boolean;
  onRestock?: () => void;
  onAdjustStock?: () => void;
  onExport?: () => void;
}

export function WarehouseHeader({
  title = "Inventori & Stok",
  description = "Pantau dan kelola ketersediaan stok gudang serta etalase toko.",
  isOwner = true,
  onRestock,
  onAdjustStock,
  onExport,
}: WarehouseHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-4 md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-1.5 shadow-xs"
        >
          <IconDownload data-icon="inline-start" className="size-4" />
          <span>Export</span>
        </Button>
        {onAdjustStock && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdjustStock}
            className="gap-1.5 shadow-xs"
          >
            <IconAdjustments data-icon="inline-start" className="size-4" />
            <span>Penyesuaian Stok</span>
          </Button>
        )}
        {isOwner && onRestock && (
          <Button
            variant="default"
            size="sm"
            onClick={onRestock}
            className="gap-1.5 shadow-xs"
          >
            <IconPlus data-icon="inline-start" className="size-4" />
            <span>Restock</span>
          </Button>
        )}
      </div>
    </div>
  );
}
