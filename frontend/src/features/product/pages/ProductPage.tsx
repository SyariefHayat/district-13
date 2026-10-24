import * as React from "react";
import { ProductHeader } from "../components/ProductHeader";
import { ProductStatsCards } from "../components/ProductStatsCards";
import { ProductTable } from "../components/ProductTable";
import { INITIAL_PRODUCTS, type ProductItem } from "../data/productData";

export default function ProductPage() {
  const [products, setProducts] =
    React.useState<ProductItem[]>(INITIAL_PRODUCTS);

  const handleToggleStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, isAvailable: !item.isAvailable }
          : item
      )
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleDeleteMultiple = (productIds: string[]) => {
    setProducts((prev) => prev.filter((item) => !productIds.includes(item.id)));
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ProductHeader />
      <ProductStatsCards products={products} />
      <ProductTable
        products={products}
        onToggleStatus={handleToggleStatus}
        onDeleteProduct={handleDeleteProduct}
        onDeleteMultiple={handleDeleteMultiple}
      />
    </div>
  );
}
