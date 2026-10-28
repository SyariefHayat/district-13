import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
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

  const handleExport = () => {
    if (!products.length) {
      toast.add({ title: "Tidak ada produk untuk diekspor" });
      return;
    }
    const json = JSON.stringify(products, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: `Berhasil mengekspor ${products.length} produk`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ProductHeader onExport={handleExport} />

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

      <ProductStatsCards products={products} isLoading={isLoading} />
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
