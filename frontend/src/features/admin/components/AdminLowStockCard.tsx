import { Link } from "react-router";
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconCheck,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminLowStockItem } from "../data/adminData";

interface AdminLowStockCardProps {
  items: AdminLowStockItem[];
  isLoading: boolean;
  onTransferClick: (item: AdminLowStockItem) => void;
}

export function AdminLowStockCard({
  items,
  isLoading,
  onTransferClick,
}: AdminLowStockCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <IconAlertTriangle className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Peringatan Stok Etalase Display
            </CardTitle>
            <CardDescription className="text-xs">
              Produk dengan stok display menipis yang perlu segera diisi dari
              gudang
            </CardDescription>
          </div>
        </div>
        <Link
          to="/dashboard/stocks"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-8 text-xs",
          })}
        >
          Inventori Lengkap
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconCheck className="size-5" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              Semua Stok Etalase Aman
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Tidak ada produk dengan stok display kritis. Semua display rak
              terisi dengan baik.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {items.slice(0, 6).map((item) => {
              const isDisplayEmpty = item.displayStock <= 0;
              const hasWarehouseStock = item.warehouseStock > 0;

              return (
                <div
                  key={item.productId}
                  className="flex flex-col gap-2 p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {item.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>
                        Stok Display:{" "}
                        <strong
                          className={
                            isDisplayEmpty
                              ? "text-destructive font-bold"
                              : "text-amber-600 dark:text-amber-400 font-semibold"
                          }
                        >
                          {item.displayStock} pcs
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Stok Gudang:{" "}
                        <strong className="text-foreground font-medium">
                          {item.warehouseStock} pcs
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {hasWarehouseStock ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => onTransferClick(item)}
                        className="h-7 gap-1 text-[11px] font-medium"
                      >
                        <IconArrowsExchange className="size-3.5" />
                        Transfer ke Display
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-destructive/30 bg-destructive/10 text-destructive text-[11px]"
                      >
                        Gudang Habis
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
