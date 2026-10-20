"use client";

import * as React from "react";
import {
  IconArrowsSort,
  IconCash,
  IconChevronLeft,
  IconChevronRight,
  IconClockHour4,
  IconDownload,
  IconReceipt2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const bestSellingProducts = [
  { product: "Iced Coffee", sold: 42, sales: 840000 },
  { product: "Cappuccino", sold: 36, sales: 900000 },
  { product: "Croissant", sold: 31, sales: 465000 },
  { product: "Matcha Latte", sold: 28, sales: 700000 },
  { product: "Americano", sold: 24, sales: 480000 },
  { product: "Chocolate Cake", sold: 19, sales: 570000 },
  { product: "Blueberry Muffin", sold: 16, sales: 320000 },
  { product: "Hot Tea", sold: 12, sales: 180000 },
];

type ProductSortKey = "sold" | "sales";

export function OverviewPlaceholderCards() {
  const [filter, setFilter] = React.useState("");
  const [sort, setSort] = React.useState<{
    key: ProductSortKey;
    direction: "asc" | "desc";
  }>({ key: "sold", direction: "desc" });

  const filteredProducts = bestSellingProducts
    .filter((item) => item.product.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const order = a[sort.key] - b[sort.key];
      return sort.direction === "asc" ? order : -order;
    });

  const toggleSort = (key: ProductSortKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6 xl:grid-cols-4">
      <Card className="gap-0 py-0 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <CardTitle className="text-base">Best Selling Products</CardTitle>
          <Button variant="outline" size="sm">
            <IconDownload />
            Export
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4">
          <Input
            aria-label="Filter products"
            placeholder="Filter products..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Product</TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                      onClick={() => toggleSort("sold")}
                      type="button"
                    >
                      Sold <IconArrowsSort className="size-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                      onClick={() => toggleSort("sales")}
                      type="button"
                    >
                      Sales <IconArrowsSort className="size-3.5" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((item, index) => (
                  <TableRow key={item.product}>
                    <TableCell className="font-medium">
                      <span className="mr-2 text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.product}
                    </TableCell>
                    <TableCell>{item.sold}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(item.sales)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="h-20 text-center text-muted-foreground"
                      colSpan={3}
                    >
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
            <span>
              {filteredProducts.length === 0
                ? "0 products"
                : `1 - ${filteredProducts.length} of ${filteredProducts.length} products`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Previous page"
                disabled
                size="icon-sm"
                variant="outline"
              >
                <IconChevronLeft />
              </Button>
              <Button
                aria-label="Next page"
                disabled
                size="icon-sm"
                variant="outline"
              >
                <IconChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 xl:col-span-1">
        <CardHeader className="border-b py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconClockHour4 className="size-4" />
            </span>
            Busy Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-48 flex-col justify-center gap-5 p-5">
          <div>
            <p className="text-sm text-muted-foreground">
              Peak transaction hour
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              12.00–13.00
            </p>
          </div>
          <div className="flex items-center gap-2 border-t pt-4 text-sm">
            <IconReceipt2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Peak day</span>
            <span className="ml-auto font-medium">Saturday</span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 xl:col-span-1">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Operational Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconReceipt2 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Active Shift</p>
              <p className="text-sm text-muted-foreground">
                2 cashier shifts currently open
              </p>
            </div>
          </div>
          <div className="flex gap-3 border-t pt-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <IconAlertTriangle className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Inventory Alert</p>
              <p className="text-sm text-muted-foreground">
                3 products below minimum stock
              </p>
            </div>
          </div>
          <div className="flex gap-3 border-t pt-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <IconCash className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Cash Flow</p>
              <p className="text-sm text-muted-foreground">
                Cash inflow and outflow summary
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
