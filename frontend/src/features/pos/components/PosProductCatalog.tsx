import { useMemo } from "react";
import {
  IconSearch,
  IconX,
  IconPlus,
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatIDR,
  getPresetImageForCategory,
} from "@/features/product/data/productData";
import type { PosProductItem } from "../types/posTypes";

interface PosProductCatalogProps {
  products: PosProductItem[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onProductClick: (product: PosProductItem) => void;
}

export function PosProductCatalog({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  isLoading,
  onProductClick,
}: PosProductCatalogProps) {
  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Semua Kategori": products.length,
    };
    products.forEach((p) => {
      counts[p.categoryName] = (counts[p.categoryName] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 1. Search Bar */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari produk (nama atau SKU)..."
          className="pl-9 pr-9 h-10 bg-background text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-4" />
          </button>
        )}
      </div>

      {/* 2. Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected =
            selectedCategory.toLowerCase() === cat.toLowerCase();
          const count = categoryCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Products Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-3 rounded-xl border border-border/60 bg-card animate-pulse"
              >
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 rounded-xl border border-dashed border-border text-muted-foreground">
            <IconAlertTriangle className="size-10 mb-2 opacity-40 text-amber-500" />
            <p className="font-semibold text-sm">Produk Tidak Ditemukan</p>
            <p className="text-xs mt-1 max-w-xs">
              Tidak ada produk yang cocok dengan filter atau kata kunci
              pencarian.
            </p>
            {(searchQuery || selectedCategory !== "Semua Kategori") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSearchChange("");
                  onSelectCategory("Semua Kategori");
                }}
                className="mt-3 text-xs"
              >
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
            {products.map((product) => {
              const isOutOfStock =
                !product.isAvailable || product.displayStock <= 0;
              const hasAddons = Boolean(
                product.addons && product.addons.length > 0
              );
              const fallbackImg = getPresetImageForCategory(
                product.categoryName
              );
              const displayImg =
                product.images && product.images.length > 0
                  ? product.images[0]
                  : fallbackImg;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && onProductClick(product)}
                  className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all text-left ${
                    isOutOfStock
                      ? "opacity-60 bg-muted/30 border-border cursor-not-allowed"
                      : "bg-card hover:bg-card/90 border-border/70 hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-[0.98]"
                  }`}
                >
                  {/* Product Image & Badges */}
                  <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center p-2 mb-2 border border-border/30">
                    <img
                      src={displayImg}
                      alt={product.name}
                      className="size-full object-contain transition-transform group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Stock status indicator badge */}
                    <div className="absolute top-1.5 right-1.5">
                      {isOutOfStock ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0 h-4 shadow-xs"
                        >
                          Habis
                        </Badge>
                      ) : product.displayStock <= 5 ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs"
                        >
                          Sisa {product.displayStock}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs"
                        >
                          Stok: {product.displayStock}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {product.categoryName}
                    </span>
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        {formatIDR(product.price)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant={hasAddons ? "outline" : "default"}
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) onProductClick(product);
                      }}
                      className="h-7 px-2 text-xs gap-1 font-medium"
                    >
                      {hasAddons ? (
                        <>
                          <IconAdjustmentsHorizontal className="size-3.5" />
                          <span className="hidden sm:inline">Opsi</span>
                        </>
                      ) : (
                        <>
                          <IconPlus className="size-3.5" />
                          <span className="hidden sm:inline">Tambah</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
