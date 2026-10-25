import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

interface ProductHeaderProps {
  title?: string;
  description?: string;
  onAddProduct?: () => void;
}

export function ProductHeader({
  title = "Product Performance",
  description = "Pantau analitik penjualan dan performa produk.",
  onAddProduct,
}: ProductHeaderProps) {
  const navigate = useNavigate();

  const handleAddClick = () => {
    if (onAddProduct) {
      onAddProduct();
    } else {
      navigate("/dashboard/products/new");
    }
  };

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

      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="default"
          onClick={handleAddClick}
          className="gap-1.5 shadow-xs"
        >
          <IconPlus data-icon="inline-start" className="size-4" />
          <span>Tambah Produk</span>
        </Button>
      </div>
    </div>
  );
}
