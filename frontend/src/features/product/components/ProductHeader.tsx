import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

interface ProductHeaderProps {
  onAddProduct?: () => void;
  onManageCategory?: () => void;
  onExport?: () => void;
}

export function ProductHeader({ onAddProduct }: ProductHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-4 md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          Katalog & Produk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Kelola master produk, varian harga, kategori menu, dan status
          ketersediaan item.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="default" onClick={onAddProduct}>
          <IconPlus data-icon="inline-start" className="size-4" />
          <span>Tambah Produk</span>
        </Button>
      </div>
    </div>
  );
}
