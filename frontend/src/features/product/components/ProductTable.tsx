import * as React from "react";
import {
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDots,
  IconDownload,
  IconLayoutColumns,
  IconPackage,
  IconTrash,
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
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { formatProductPrice, type ProductItem } from "../data/productData";
import { ProductFilterBar, type FilterItem } from "./ProductFilterBar";

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, ProductItem>();

function getProductStatus(
  product: ProductItem
): "Active" | "Out of stock" | "Inactive" {
  if (!product.isActive) return "Inactive";
  if (product.stock === 0 || !product.isAvailable) return "Out of stock";
  return "Active";
}

interface ProductTableProps {
  products: ProductItem[];
  onToggleStatus?: (productId: string) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
  onDeleteMultiple?: (productIds: string[]) => void;
  onViewDetails?: (product: ProductItem) => void;
  onExport?: (selectedProducts: ProductItem[]) => void;
}

export function ProductTable({
  products,
  onToggleStatus,
  onEditProduct,
  onDeleteProduct,
  onDeleteMultiple,
  onViewDetails,
  onExport,
}: ProductTableProps) {
  const [filters, setFilters] = React.useState<FilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
  };

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            product.name.toLowerCase().includes(q) ||
            product.sku.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "status") {
          const status = getProductStatus(product);
          if (status !== filter.value) return false;
        }

        if (filter.id === "category") {
          if (product.category !== filter.value) return false;
        }

        if (filter.id === "price") {
          if (filter.value === "under-50k" && product.price >= 50000)
            return false;
          if (
            filter.value === "50k-150k" &&
            (product.price < 50000 || product.price > 150000)
          ) {
            return false;
          }
          if (filter.value === "over-150k" && product.price <= 150000)
            return false;
        }

        if (filter.id === "stock") {
          if (
            filter.value === "in-stock" &&
            (product.stock <= 0 || !product.isAvailable)
          ) {
            return false;
          }
          if (
            filter.value === "out-of-stock" &&
            product.stock > 0 &&
            product.isAvailable
          ) {
            return false;
          }
          if (
            filter.value === "low-stock" &&
            (product.stock <= 0 || product.stock > 10)
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [products, filters]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "revenue", desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
        }),
        columnHelper.accessor("name", {
          id: "product",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Product</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground border border-border/50">
                {row.original.image ? (
                  <img
                    src={row.original.image}
                    alt={row.original.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <IconPackage className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">
                  {row.original.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {row.original.sku}
                </span>
              </div>
            </div>
          ),
          enableHiding: false,
        }),
        columnHelper.accessor("category", {
          id: "category",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Category</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm text-foreground">
              {row.original.category}
            </span>
          ),
        }),
        columnHelper.accessor("price", {
          id: "price",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Price</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm font-medium text-foreground">
              {formatProductPrice(row.original.price)}
            </span>
          ),
        }),
        columnHelper.accessor("soldCount", {
          id: "soldCount",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Sold</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm font-medium text-foreground tabular-nums">
              {(row.original.soldCount ?? 0).toLocaleString("id-ID")}
            </span>
          ),
        }),
        columnHelper.accessor((row) => row.price * (row.soldCount || 0), {
          id: "revenue",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Revenue</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatProductPrice(
                row.original.price * (row.original.soldCount || 0)
              )}
            </span>
          ),
        }),
        columnHelper.accessor("stock", {
          id: "stock",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Stock</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm text-foreground tabular-nums">
              {row.original.stock}
            </span>
          ),
        }),
        columnHelper.accessor((row) => getProductStatus(row), {
          id: "status",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Status</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const status = getProductStatus(row.original);
            if (status === "Active") {
              return (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-0.5 rounded-full text-xs"
                >
                  Active
                </Badge>
              );
            }
            if (status === "Out of stock") {
              return (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium px-2.5 py-0.5 rounded-full text-xs"
                >
                  Out of stock
                </Badge>
              );
            }
            return (
              <Badge
                variant="outline"
                className="border-muted text-muted-foreground font-medium px-2.5 py-0.5 rounded-full text-xs"
              >
                Inactive
              </Badge>
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: () => null,
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="flex size-8 text-muted-foreground data-[state=open]:bg-muted ml-auto"
                    size="icon"
                  >
                    <IconDots className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-40">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Actions
                </div>
                <DropdownMenuItem onClick={() => onViewDetails?.(row.original)}>
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditProduct?.(row.original)}>
                  Edit
                </DropdownMenuItem>
                {onToggleStatus && (
                  <DropdownMenuItem
                    onClick={() => onToggleStatus(row.original.id)}
                  >
                    {row.original.isAvailable
                      ? "Set out of stock"
                      : "Set available"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(row.original.id);
                    toast.add({ title: "ID copied to clipboard" });
                  }}
                >
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteProduct?.(row.original.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
          enableSorting: false,
          enableHiding: false,
        }),
      ]),
    [onViewDetails, onEditProduct, onToggleStatus, onDeleteProduct]
  );

  const table = useTable({
    features,
    data: filteredProducts,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleDeleteSelected = () => {
    const ids = selectedRows.map((r) => r.original.id);
    if (onDeleteMultiple) {
      onDeleteMultiple(ids);
    } else if (onDeleteProduct) {
      ids.forEach((id) => onDeleteProduct(id));
    }
    table.resetRowSelection();
    toast.add({
      title: `${selectedCount} item${selectedCount > 1 ? "s" : ""} deleted`,
    });
  };

  const handleExport = () => {
    const itemsToExport = selectedRows.map((r) => r.original);
    if (onExport) {
      onExport(itemsToExport);
    } else {
      const json = JSON.stringify(itemsToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Exported ${itemsToExport.length} products`,
      });
    }
  };

  return (
    <div className="px-4 md:px-6">
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        {/* Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 border-b">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExport}
              >
                <IconDownload className="size-4" />
                <span>Export</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-500/30 shadow-none dark:bg-red-500/20 dark:text-red-400"
                onClick={handleDeleteSelected}
              >
                <IconTrash className="size-4" />
                <span>Delete</span>
              </Button>
            </div>
          ) : (
            <ProductFilterBar filters={filters} onFiltersChange={setFilters} />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {selectedCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.resetRowSelection()}
              >
                Cancel
              </Button>
            ) : (
              filters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                >
                  Clear
                </Button>
              )
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <IconLayoutColumns className="size-4" />
                    <span>Columns</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    const columnLabels: Record<string, string> = {
                      product: "Product",
                      category: "Category",
                      price: "Price",
                      soldCount: "Sold",
                      revenue: "Revenue",
                      stock: "Stock",
                      status: "Status",
                    };
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {columnLabels[column.id] || column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={
                        header.id === "select"
                          ? "w-10 px-2"
                          : header.id === "actions"
                            ? "w-12 px-2 text-right"
                            : ""
                      }
                    >
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 data-[state=selected]:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "select"
                            ? "w-10 px-2"
                            : cell.column.id === "actions"
                              ? "w-12 px-2 text-right"
                              : ""
                        }
                      >
                        <FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <IconPackage className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">No products found</p>
                      <p className="text-xs text-muted-foreground">
                        Try modifying your search or reset filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-t">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="rows-per-page"
                className="text-sm font-medium whitespace-nowrap"
              >
                Rows per page
              </Label>
              <Select
                value={`${table.state.pagination.pageSize}`}
                onValueChange={(value) => {
                  if (value) table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-18" id="rows-per-page">
                  <SelectValue placeholder={table.state.pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium whitespace-nowrap">
              Page {table.state.pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                className="hidden size-8 p-0 sm:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 p-0 sm:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
