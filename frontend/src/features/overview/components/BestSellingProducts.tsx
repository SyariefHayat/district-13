"use client";

import * as React from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDots,
  IconDownload,
  IconSelector,
  IconShirt,
} from "@tabler/icons-react";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
} from "@tanstack/react-table";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const productSchema = z.object({
  id: z.string().optional(),
  product: z.string(),
  sold: z.number(),
  sales: z.number(),
  image: z.string().optional(),
  category: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;

const bestSellingProducts: Product[] = [
  {
    id: "1",
    product: "Sports Shoes",
    sold: 316000,
    sales: 10,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80",
    category: "Footwear",
  },
  {
    id: "2",
    product: "Black T-Shirt",
    sold: 274000,
    sales: 20,
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "3",
    product: "Jeans",
    sold: 195000,
    sales: 15,
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "4",
    product: "Red Sneakers",
    sold: 402000,
    sales: 40,
    image:
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=100&auto=format&fit=crop&q=80",
    category: "Footwear",
  },
  {
    id: "5",
    product: "Red Scarf",
    sold: 280000,
    sales: 37,
    image:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "6",
    product: "Kitchen Accessory",
    sold: 150000,
    sales: 18,
    image:
      "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100&auto=format&fit=crop&q=80",
    category: "Kitchen",
  },
  {
    id: "7",
    product: "Bicycle",
    sold: 316000,
    sales: 25,
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=100&auto=format&fit=crop&q=80",
    category: "Sports",
  },
  {
    id: "8",
    product: "Sports Shoes",
    sold: 290000,
    sales: 12,
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&auto=format&fit=crop&q=80",
    category: "Footwear",
  },
  {
    id: "9",
    product: "Leather Jacket",
    sold: 450000,
    sales: 14,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "10",
    product: "Running Cap",
    sold: 85000,
    sales: 30,
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "11",
    product: "Classic Watch",
    sold: 520000,
    sales: 8,
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "12",
    product: "Denim Jacket",
    sold: 210000,
    sales: 22,
    image:
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "13",
    product: "Wireless Earbuds",
    sold: 175000,
    sales: 50,
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    id: "14",
    product: "Canvas Backpack",
    sold: 130000,
    sales: 35,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "15",
    product: "Sunglasses",
    sold: 95000,
    sales: 28,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "16",
    product: "Winter Beanie",
    sold: 45000,
    sales: 42,
    image:
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "17",
    product: "Smart Fitness Band",
    sold: 110000,
    sales: 19,
    image:
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=100&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    id: "18",
    product: "Silk Tie",
    sold: 65000,
    sales: 16,
    image:
      "https://images.unsplash.com/photo-1589756823695-278bc923f962?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "19",
    product: "Casual Hoodie",
    sold: 230000,
    sales: 27,
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "20",
    product: "Travel Duffel Bag",
    sold: 340000,
    sales: 11,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
];

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, Product>();

function ProductThumbnail({ name, src }: { name: string; src?: string }) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted/60">
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <IconShirt className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}

const columns = columnHelper.columns([
  columnHelper.accessor("product", {
    header: () => <span className="font-medium text-foreground">Product</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-3 py-1">
        <ProductThumbnail
          name={row.original.product}
          src={row.original.image}
        />
        <span className="font-medium text-foreground">
          {row.original.product}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("sold", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 gap-1 px-3 text-xs font-medium hover:bg-transparent hover:text-foreground"
        onClick={column.getToggleSortingHandler()}
      >
        Sold
        <IconSelector className="size-3.5 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-semibold text-foreground tabular-nums">
        {new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(row.original.sold)}
      </div>
    ),
  }),
  columnHelper.accessor("sales", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 gap-1 px-3 text-xs font-medium hover:bg-transparent hover:text-foreground"
        onClick={column.getToggleSortingHandler()}
      >
        Sales
        <IconSelector className="size-3.5 text-muted-foreground" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground tabular-nums">
        {row.original.sales}
      </div>
    ),
  }),
  columnHelper.display({
    id: "actions",
    cell: () => (
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
              >
                <IconDots className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit product</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  }),
]);

interface BestSellingProductsProps {
  data?: Product[];
}

export function BestSellingProducts({
  data = bestSellingProducts,
}: BestSellingProductsProps = {}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const table = useTable({
    features,
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row, index) => row.id ?? `${row.product}-${index}`,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const totalRows = filteredRows.length;
  const pageIndex = table.state.pagination.pageIndex;
  const pageSize = table.state.pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <Card className="gap-0 py-0 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between border-b py-4">
        <CardTitle className="text-base">Best Selling Products</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <IconDownload className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : (
                        <FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {totalRows === 0
              ? "0 products"
              : `${startRow} - ${endRow} of ${totalRows} products`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
