import * as React from "react";
import { Link } from "react-router";
import { IconArrowRight, IconBox, IconSearch } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "../data/cashierData";
import type { CashierProductStock } from "../data/cashierData";

interface CashierQuickProductStockProps {
  products: CashierProductStock[];
  isLoading: boolean;
}

export function CashierQuickProductStock({
  products,
  isLoading,
}: CashierQuickProductStockProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return products.slice(0, 8);
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <IconBox className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Cek Stok Etalase
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ketersediaan produk langsung di counter kasir
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/dashboard/products" />}
          className="h-8 gap-1 text-xs text-primary font-medium"
        >
          <span>Katalog</span>
          <IconArrowRight className="size-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama produk, SKU, kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="divide-y divide-border/60 rounded-lg border max-h-[290px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {isLoading
                ? "Memuat katalog..."
                : search
                  ? "Produk tidak ditemukan"
                  : "Belum ada data produk"}
            </div>
          ) : (
            filtered.map((item) => {
              const stock = item.displayStock;
              const isOutOfStock = stock <= 0 || !item.isAvailable;
              const isLowStock = stock > 0 && stock <= 5;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/30 text-xs transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{item.categoryName}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        {formatIDR(item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {stock}{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          pcs
                        </span>
                      </p>
                    </div>

                    <Badge
                      variant={isOutOfStock ? "destructive" : "outline"}
                      className={`text-[10px] px-1.5 py-0 ${
                        isOutOfStock
                          ? ""
                          : isLowStock
                            ? "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
                            : "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {isOutOfStock
                        ? "Habis"
                        : isLowStock
                          ? "Sisa Sedikit"
                          : "Tersedia"}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
