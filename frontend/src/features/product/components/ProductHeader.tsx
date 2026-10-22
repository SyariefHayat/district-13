import { Button } from "@/components/ui/button";
import { IconDownload, IconFolder, IconPlus } from "@tabler/icons-react";

interface ProductHeaderProps {
  onAddProduct?: () => void;
  onManageCategory?: () => void;
  onExport?: () => void;
}

export function ProductHeader({
  onAddProduct,
  onManageCategory,
  onExport,
}: ProductHeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          Katalog & Produk
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola master produk, varian harga, kategori menu, dan status
          ketersediaan item.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onExport}
        >
          <IconDownload className="size-4" />
          <span>Ekspor</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onManageCategory}
        >
          <IconFolder className="size-4" />
          <span>Kategori</span>
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onAddProduct}
        >
          <IconPlus className="size-4" />
          <span>Tambah Produk</span>
        </Button>
      </div>
    </div>
  );
}
