import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ProductHeader } from "../components/ProductHeader";
import { ProductStatsCards } from "../components/ProductStatsCards";
import { ProductTable } from "../components/ProductTable";
import { useProductData } from "../hooks/useProductData";

export default function ProductPage() {
  const {
    products,
    categories,
    isLoading,
    error,
    refetch,
    toggleStatus,
    deleteProduct,
    deleteMultiple,
  } = useProductData();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ProductHeader />

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

      <ProductStatsCards products={products} />
      <ProductTable
        products={products}
        categories={categories.length > 0 ? categories : undefined}
        isLoading={isLoading}
        onToggleStatus={toggleStatus}
        onDeleteProduct={deleteProduct}
        onDeleteMultiple={deleteMultiple}
      />
    </div>
  );
}
