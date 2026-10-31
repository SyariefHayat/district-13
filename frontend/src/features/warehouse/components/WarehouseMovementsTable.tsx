import * as React from "react";
import { useNavigate } from "react-router";
import {
  IconArrowDownLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconArrowsSort,
  IconArrowsTransferUpDown,
  IconBuildingWarehouse,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCopy,
  IconDots,
  IconDownload,
  IconLayoutColumns,
  IconPackage,
  IconRefresh,
  IconUser,
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
import { cn } from "@/lib/utils";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import type {
  WarehouseInventoryItem,
  WarehouseMovementItem,
} from "../data/warehouseData";
import {
  WarehouseMovementsFilterBar,
  type MovementFilterItem,
} from "./WarehouseMovementsFilterBar";

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
  WarehouseMovementItem
>();

function formatMovementDate(isoStr: string) {
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoStr;
  }
}

function getMovementBadge(type: WarehouseMovementItem["type"]) {
  switch (type) {
    case "STOCK_IN":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-0.5 rounded-full text-xs gap-1"
        >
          <IconArrowDownLeft className="size-3" />
          <span>Stock In</span>
        </Badge>
      );
    case "TRANSFER":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium px-2.5 py-0.5 rounded-full text-xs gap-1"
        >
          <IconArrowsTransferUpDown className="size-3" />
          <span>Transfer</span>
        </Badge>
      );
    case "SALE":
      return (
        <Badge
          variant="outline"
          className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium px-2.5 py-0.5 rounded-full text-xs gap-1"
        >
          <IconArrowUpRight className="size-3" />
          <span>Sale</span>
        </Badge>
      );
    case "VOID_RETURN":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium px-2.5 py-0.5 rounded-full text-xs gap-1"
        >
          <IconRefresh className="size-3" />
          <span>Void Return</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="rounded-full text-xs">
          {type}
        </Badge>
      );
  }
}

function formatLocationName(loc?: string | null) {
  if (!loc) return "";
  if (loc === "WAREHOUSE") return "Warehouse";
  if (loc === "DISPLAY") return "Display";
  return loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
}

function getMovementRoute(item: WarehouseMovementItem) {
  const from = formatLocationName(item.fromLocation);
  const to = formatLocationName(item.toLocation);

  if (item.type === "STOCK_IN") {
    return { from: "Supplier", to: to || "Warehouse" };
  }
  if (item.type === "SALE") {
    return { from: from || "Display", to: "Customer" };
  }
  if (item.type === "VOID_RETURN") {
    return { from: "Customer", to: to || "Display" };
  }
  if (item.type === "TRANSFER") {
    return { from: from || "Warehouse", to: to || "Display" };
  }
  return { from: from || "—", to: to || "—" };
}

interface WarehouseMovementsTableProps {
  movements: WarehouseMovementItem[];
  items?: WarehouseInventoryItem[];
  isLoading?: boolean;
  onExport?: (selectedMovements: WarehouseMovementItem[]) => void;
  onViewProduct?: (productId: string) => void;
}

export function WarehouseMovementsTable({
  movements,
  items = [],
  isLoading,
  onExport,
  onViewProduct,
}: WarehouseMovementsTableProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState<MovementFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: MovementFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  // Map of productId to item details for quick lookup
  const itemMap = React.useMemo(() => {
    const map = new Map<string, WarehouseInventoryItem>();
    for (const item of items) {
      if (item.productId) map.set(item.productId, item);
      if (item.id) map.set(item.id, item);
    }
    return map;
  }, [items]);

  // Distinct list of usernames for filter
  const usersList = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of movements) {
      if (m.username) set.add(m.username);
    }
    return Array.from(set);
  }, [movements]);

  // Client-side filtering
  const filteredMovements = React.useMemo(() => {
    return movements.filter((m) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const item = itemMap.get(m.productId);
          const nameMatch = (m.productName || item?.name || "")
            .toLowerCase()
            .includes(q);
          const skuMatch = (item?.sku || "").toLowerCase().includes(q);
          const userMatch = (m.username || "").toLowerCase().includes(q);
          const idMatch = (m.transactionId || m.id).toLowerCase().includes(q);
          if (!nameMatch && !skuMatch && !userMatch && !idMatch) return false;
        }

        if (filter.id === "type") {
          if (m.type !== filter.value) {
            return false;
          }
        }

        if (filter.id === "location") {
          const matchesFrom = m.fromLocation === filter.value;
          const matchesTo = m.toLocation === filter.value;
          if (!matchesFrom && !matchesTo) return false;
        }

        if (filter.id === "user") {
          if (m.username !== filter.value) return false;
        }
      }

      return true;
    });
  }, [movements, filters, itemMap]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
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

        columnHelper.accessor("createdAt", {
          id: "createdAt",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Time</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex flex-col min-w-32">
              <span className="font-mono text-xs text-foreground font-medium">
                {formatMovementDate(row.original.createdAt)}
              </span>
              {row.original.transactionId ? (
                <span className="font-mono text-[11px] text-muted-foreground">
                  Ref: #{row.original.transactionId.slice(-6).toUpperCase()}
                </span>
              ) : null}
            </div>
          ),
        }),

        columnHelper.accessor("productName", {
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
          cell: ({ row }) => {
            const item = itemMap.get(row.original.productId);
            const name = row.original.productName || item?.name || "Product";
            const sku = item?.sku || row.original.productId.slice(0, 8);
            const image = item?.image;

            return (
              <div className="flex items-center gap-3 min-w-44">
                <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground border border-border/50">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <IconBuildingWarehouse className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate max-w-44 sm:max-w-64 text-sm">
                    {name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {sku}
                  </span>
                </div>
              </div>
            );
          },
        }),

        columnHelper.accessor("type", {
          id: "type",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Type</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => getMovementBadge(row.original.type),
        }),

        columnHelper.display({
          id: "route",
          header: "From → To",
          cell: ({ row }) => {
            const { from, to } = getMovementRoute(row.original);
            return (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-muted-foreground font-medium">
                  {from}
                </span>
                <IconArrowRight className="size-3 text-muted-foreground/60 shrink-0" />
                <span className="text-foreground font-semibold">{to}</span>
              </div>
            );
          },
        }),

        columnHelper.accessor("quantity", {
          id: "quantity",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Quantity</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const isPositive =
              row.original.type === "STOCK_IN" ||
              row.original.type === "VOID_RETURN";
            return (
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                )}
              >
                {isPositive
                  ? `+${row.original.quantity}`
                  : `-${row.original.quantity}`}
                <span className="text-xs text-muted-foreground ml-1">pcs</span>
              </span>
            );
          },
        }),

        columnHelper.accessor("username", {
          id: "user",
          header: "User",
          cell: ({ row }) => (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconUser className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="text-foreground font-medium">
                {row.original.username || "System"}
              </span>
            </div>
          ),
        }),

        columnHelper.display({
          id: "actions",
          header: () => null,
          cell: ({ row }) => {
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
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(row.original.id);
                      toast.add({ title: "ID Mutasi disalin ke clipboard" });
                    }}
                  >
                    <IconCopy className="size-4 mr-2" />
                    <span>Salin ID Mutasi</span>
                  </DropdownMenuItem>

                  {row.original.transactionId && (
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(
                          row.original.transactionId || ""
                        );
                        toast.add({
                          title: "ID Transaksi disalin ke clipboard",
                        });
                      }}
                    >
                      <IconCopy className="size-4 mr-2" />
                      <span>Salin Ref Transaksi</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      if (onViewProduct) {
                        onViewProduct(row.original.productId);
                      } else {
                        navigate(
                          `/dashboard/stocks?search=${encodeURIComponent(
                            row.original.productName
                          )}`
                        );
                      }
                    }}
                  >
                    <IconPackage className="size-4 mr-2" />
                    <span>Lihat di Stok</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
          enableSorting: false,
          enableHiding: false,
        }),
      ]),
    [itemMap, onViewProduct, navigate]
  );

  const table = useTable({
    features,
    data: filteredMovements,
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

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleExport = () => {
    const listToExport =
      selectedCount > 0
        ? selectedRows.map((r) => r.original)
        : filteredMovements;

    if (onExport) {
      onExport(listToExport);
    } else {
      if (!listToExport.length) {
        toast.add({ title: "Tidak ada data untuk diekspor" });
        return;
      }
      const json = JSON.stringify(listToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mutation-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${listToExport.length} catatan mutasi`,
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
                {selectedCount} dipilih
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExport}
              >
                <IconDownload className="size-4" />
                <span>Ekspor</span>
              </Button>
            </div>
          ) : (
            <WarehouseMovementsFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              users={usersList}
            />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {selectedCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.resetRowSelection()}
              >
                Batal
              </Button>
            ) : (
              filters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                >
                  Reset filter
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
                      createdAt: "Time",
                      product: "Product",
                      type: "Type",
                      route: "From → To",
                      quantity: "Quantity",
                      user: "User",
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
                      <Skeleton className="h-4 w-28" />
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
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="w-12 px-2 text-right">
                      <Skeleton className="size-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
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
                      <p className="text-sm font-medium">No movements found</p>
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
