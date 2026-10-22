import * as React from "react";
import { ProductHeader } from "../components/ProductHeader";
import { ProductStatsCards } from "../components/ProductStatsCards";
import { ProductFilterBar } from "../components/ProductFilterBar";
import { ProductTable } from "../components/ProductTable";
import { INITIAL_PRODUCTS, type ProductItem } from "../data/productData";

export default function ProductPage() {
  const [products, setProducts] =
    React.useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    React.useState<string>("Semua Kategori");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim() === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "Semua Kategori" ||
        product.category === selectedCategory;

      // Status filter
      let matchesStatus = true;
      if (selectedStatus === "available") {
        matchesStatus =
          product.isActive && product.isAvailable && product.stock > 0;
      } else if (selectedStatus === "out_of_stock") {
        matchesStatus = product.stock === 0 || !product.isAvailable;
      } else if (selectedStatus === "inactive") {
        matchesStatus = !product.isActive;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

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

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("Semua Kategori");
    setSelectedStatus("all");
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ProductHeader />
      <ProductStatsCards products={products} />
      <ProductFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
      />
      <ProductTable
        products={filteredProducts}
        onToggleStatus={handleToggleStatus}
        onDeleteProduct={handleDeleteProduct}
      />
    </div>
  );
}
