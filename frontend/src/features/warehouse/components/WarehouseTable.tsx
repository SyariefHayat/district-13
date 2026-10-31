import * as React from "react";
import {
  IconArrowsSort,
  IconArrowsTransferUpDown,
  IconBolt,
  IconBuildingWarehouse,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCopy,
  IconDots,
  IconDownload,
  IconHistory,
  IconLayoutColumns,
  IconPlus,
  IconRotate2,
  IconX,
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
import { cn } from "cn";

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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  formatIDR,
  getWarehouseStockRecommendation,
  getWarehouseStockStatus,
  type WarehouseInventoryItem,
} from "../data/warehouseData";
import {
  WarehouseFilterBar,
  type WarehouseFilterItem,
} from "./WarehouseFilterBar";

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

const columnHelper = createColumnHelper<
  typeof features,
  WarehouseInventoryItem
>();

interface WarehouseTableProps {
  items: WarehouseInventoryItem[];
  categories?: string[];
  isLoading?: boolean;
  onOpenRestock?: (item: WarehouseInventoryItem) => void;
  onOpenTransfer?: (item: WarehouseInventoryItem) => void;
  onViewMovements?: (item: WarehouseInventoryItem) => void;
  onExport?: (selectedItems: WarehouseInventoryItem[]) => void;
}

export function WarehouseTable({
  items,
  categories,
  isLoading,
  onOpenRestock,
  onOpenTransfer,
  onViewMovements,
  onExport,
}: WarehouseTableProps) {
  const [filters, setFilters] = React.useState<WarehouseFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: WarehouseFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "status") {
          const status = getWarehouseStockStatus(item);
          if (status !== filter.value) return false;
        }

        if (filter.id === "category") {
          if (item.category !== filter.value) return false;
        }

        if (filter.id === "stock") {
          if (filter.value === "over-50" && item.warehouseStock <= 50) {
            return false;
          }
          if (
            filter.value === "10-to-50" &&
            (item.warehouseStock < 10 || item.warehouseStock > 50)
          ) {
            return false;
          }
          if (filter.value === "under-10" && item.warehouseStock >= 10) {
            return false;
          }
          if (filter.value === "display-zero" && item.displayStock > 0) {
            return false;
          }
        }
      }
      return true;
    });
  }, [items, filters]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "totalStock", desc: true },
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
              <span>Barang / Item</span>
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
                  <IconBuildingWarehouse className="size-5 text-muted-foreground" />
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
              <span>Kategori</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm text-foreground">
              {row.original.category}
            </span>
          ),
        }),
        columnHelper.accessor("warehouseStock", {
          id: "warehouseStock",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Stok Gudang</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const stock = row.original.warehouseStock;
            const isLow = stock <= row.original.minStockThreshold;
            return (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "font-semibold text-sm tabular-nums",
                    stock === 0
                      ? "text-destructive"
                      : isLow
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-foreground"
                  )}
                >
                  {stock.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-muted-foreground">unit</span>
                {isLow && stock > 0 && (
                  <span className="size-1.5 rounded-full bg-amber-500" />
                )}
                {stock === 0 && (
                  <span className="size-1.5 rounded-full bg-destructive" />
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("displayStock", {
          id: "displayStock",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Stok Etalase</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const stock = row.original.displayStock;
            const isCritical = stock <= 3;
            return (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "font-medium text-sm tabular-nums",
                    stock === 0
                      ? "text-destructive font-semibold"
                      : isCritical
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-foreground"
                  )}
                >
                  {stock.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-muted-foreground">unit</span>
                {isCritical && stock > 0 && (
                  <span className="size-1.5 rounded-full bg-blue-500" />
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("totalStock", {
          id: "totalStock",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Total Fisik</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {row.original.totalStock.toLocaleString("id-ID")}
            </span>
          ),
        }),
        columnHelper.accessor(
          (row) => row.warehouseStock * (row.costPrice || 0),
          {
            id: "valuation",
            header: ({ column }) => (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => column.toggleSorting()}
              >
                <span>Valuasi Gudang</span>
                <IconArrowsSort className="size-3.5 text-muted-foreground" />
              </Button>
            ),
            cell: ({ row }) => (
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatIDR(
                  row.original.warehouseStock * (row.original.costPrice || 0)
                )}
              </span>
            ),
          }
        ),
        columnHelper.accessor(
          (row) => getWarehouseStockRecommendation(row).label,
          {
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
              const rec = getWarehouseStockRecommendation(row.original);
              return (
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs gap-1 font-medium whitespace-nowrap",
                    rec.badgeClass
                  )}
                >
                  {rec.status === "needs_display_transfer" && (
                    <IconBolt className="size-3" />
                  )}
                  <span>{rec.label}</span>
                </Badge>
              );
            },
          }
        ),
        columnHelper.display({
          id: "actions",
          header: () => null,
          cell: ({ row }) => {
            const item = row.original;
            return (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="flex size-8 text-muted-foreground data-[state=open]:bg-muted ml-auto"
                      size="icon"
                    >
                      <IconDots className="size-4" />
                      <span className="sr-only">Buka menu aksi</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Aksi
                  </div>
                  <DropdownMenuItem
                    onClick={() => onOpenTransfer?.(item)}
                    disabled={item.warehouseStock <= 0}
                  >
                    <IconArrowsTransferUpDown className="size-4 mr-2" />
                    <span>Transfer Etalase</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenRestock?.(item)}>
                    <IconPlus className="size-4 mr-2" />
                    <span>Restock</span>
                  </DropdownMenuItem>
                  {onViewMovements && (
                    <DropdownMenuItem onClick={() => onViewMovements(item)}>
                      <IconHistory className="size-4 mr-2" />
                      <span>Riwayat Mutasi</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(item.sku);
                      toast.add({
                        title: `SKU "${item.sku}" berhasil disalin`,
                      });
                    }}
                  >
                    <IconCopy className="size-4 mr-2" />
                    <span>Salin SKU</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
          enableSorting: false,
          enableHiding: false,
        }),
      ]),
    [onOpenRestock, onOpenTransfer, onViewMovements]
  );

  const table = useTable({
    features,
    data: filteredItems,
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
    autoResetPageIndex: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  const pageCount = table.getPageCount();
  React.useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex >= pageCount) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(0, pageCount - 1),
      }));
    }
  }, [pageCount, pagination.pageIndex]);

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleExportSelected = () => {
    const itemsToExport = selectedRows.map((r) => r.original);
    if (onExport) {
      onExport(itemsToExport);
    } else {
      const json = JSON.stringify(itemsToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `warehouse-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${itemsToExport.length} item inventori`,
      });
    }
  };

  return (
    <div className="px-4 md:px-6">
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        {/* Toolbar & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 border-b">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedCount} item dipilih
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportSelected}
              >
                <IconDownload className="size-4" />
                <span>Ekspor</span>
              </Button>
            </div>
          ) : (
            <WarehouseFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={categories}
            />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {selectedCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => table.resetRowSelection()}
              >
                <IconX className="size-4" />
                <span>Batal</span>
              </Button>
            ) : (
              filters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleClearAllFilters}
                >
                  <IconRotate2 className="size-4" />
                  <span>Reset</span>
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
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    const columnLabels: Record<string, string> = {
                      product: "Barang / SKU",
                      category: "Kategori",
                      warehouseStock: "Stok Gudang",
                      displayStock: "Stok Etalase",
                      totalStock: "Total Fisik",
                      valuation: "Valuasi",
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
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow
                    key={`skeleton-row-${idx}`}
                    className="hover:bg-transparent"
                  >
                    <TableCell className="w-10 px-2">
                      <div className="flex items-center justify-center">
                        <Skeleton className="size-4 rounded" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-lg shrink-0" />
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <Skeleton className="h-4 w-32 sm:w-44" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="w-12 px-2 text-right">
                      <Skeleton className="size-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconBuildingWarehouse className="size-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">
                        Tidak ada barang ditemukan pada kriteria ini
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {filters.length > 0
                          ? "Coba ubah atau reset filter pencarian Anda"
                          : "Tambahkan pasokan baru untuk mulai mengelola stok"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
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
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm">Baris per halaman</span>
            <Select
              value={String(table.state.pagination.pageSize)}
              onValueChange={(val) => table.setPageSize(Number(val))}
            >
              <SelectTrigger className="h-8 w-18">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs sm:text-sm font-medium text-foreground">
              Halaman {table.state.pagination.pageIndex + 1} dari{" "}
              {Math.max(1, table.getPageCount())}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="size-4" />
                <span className="sr-only">Halaman Pertama</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="size-4" />
                <span className="sr-only">Halaman Sebelumnya</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="size-4" />
                <span className="sr-only">Halaman Berikutnya</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="size-4" />
                <span className="sr-only">Halaman Terakhir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
