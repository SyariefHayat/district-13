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
  IconLayersIntersect,
  IconLayersOff,
  IconLink,
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { formatIDR, type AddonItem } from "../data/addonData";
import { AddonFilterBar, type AddonFilterItem } from "./AddonFilterBar";

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

const columnHelper = createColumnHelper<typeof features, AddonItem>();

interface AddonTableProps {
  addons: AddonItem[];
  categories?: string[];
  isLoading?: boolean;
  onToggleStatus?: (addonId: string) => void;
  onEditAddon?: (addon: AddonItem) => void;
  onDeleteAddon?: (addonId: string) => void | Promise<void>;
  onDeleteMultiple?: (addonIds: string[]) => void | Promise<void>;
  onExport?: (selectedAddons: AddonItem[]) => void;
}

export function AddonTable({
  addons,
  categories,
  isLoading,
  onToggleStatus,
  onEditAddon,
  onDeleteAddon,
  onDeleteMultiple,
  onExport,
}: AddonTableProps) {
  const [filters, setFilters] = React.useState<AddonFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: AddonFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredAddons = React.useMemo(() => {
    return addons.filter((addon) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            addon.name.toLowerCase().includes(q) ||
            addon.id.toLowerCase().includes(q) ||
            addon.category.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "status") {
          if (filter.value === "active" && !addon.isActive) return false;
          if (filter.value === "inactive" && addon.isActive) return false;
        }

        if (filter.id === "category") {
          if (addon.category !== filter.value) return false;
        }

        if (filter.id === "price") {
          if (filter.value === "under-5k" && addon.price >= 5000) return false;
          if (
            filter.value === "5k-10k" &&
            (addon.price < 5000 || addon.price > 10000)
          ) {
            return false;
          }
          if (filter.value === "over-10k" && addon.price <= 10000) return false;
        }
      }
      return true;
    });
  }, [addons, filters]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "addon", desc: false },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isDeletingSelected, setIsDeletingSelected] = React.useState(false);
  const [deletingAddonIds, setDeletingAddonIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const handleDeleteSingleAddon = React.useCallback(
    async (addonId: string, addonName: string) => {
      if (deletingAddonIds.has(addonId)) return;
      setDeletingAddonIds((prev) => new Set(prev).add(addonId));
      try {
        await onDeleteAddon?.(addonId);
        toast.add({
          title: `Varian "${addonName}" dihapus`,
        });
      } finally {
        setDeletingAddonIds((prev) => {
          const next = new Set(prev);
          next.delete(addonId);
          return next;
        });
      }
    },
    [deletingAddonIds, onDeleteAddon]
  );

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
                aria-label="Pilih semua"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Pilih baris"
              />
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
        }),
        columnHelper.accessor("name", {
          id: "addon",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Varian / Add-on</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground border border-border/50">
                <IconLayersIntersect className="size-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">
                  {row.original.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {row.original.id}
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
        columnHelper.accessor("price", {
          id: "price",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Harga Tambahan</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatIDR(row.original.price)}
            </span>
          ),
        }),
        columnHelper.accessor("linkedProductsCount", {
          id: "linkedProducts",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Terkait Menu</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <IconLink className="size-3.5 text-muted-foreground/70" />
              <span className="tabular-nums font-medium text-foreground">
                {row.original.linkedProductsCount}
              </span>
              <span>produk</span>
            </div>
          ),
        }),
        columnHelper.accessor((row) => (row.isActive ? "Active" : "Inactive"), {
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
            if (row.original.isActive) {
              return (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-0.5 rounded-full text-xs"
                >
                  Active
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
          cell: ({ row }) => {
            const isDeletingThisRow = deletingAddonIds.has(row.original.id);
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
                    Aksi Varian
                  </div>
                  <DropdownMenuItem onClick={() => onEditAddon?.(row.original)}>
                    Ubah data varian
                  </DropdownMenuItem>
                  {onToggleStatus && (
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(row.original.id)}
                    >
                      {row.original.isActive
                        ? "Nonaktifkan varian"
                        : "Aktifkan varian"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(row.original.id);
                      toast.add({ title: "ID varian berhasil disalin" });
                    }}
                  >
                    Salin ID varian
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isDeletingThisRow}
                    onClick={() => {
                      if (isDeletingThisRow) return;
                      void handleDeleteSingleAddon(
                        row.original.id,
                        row.original.name
                      );
                    }}
                  >
                    {isDeletingThisRow ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="size-3.5" />
                        Menghapus...
                      </span>
                    ) : (
                      "Hapus varian"
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
          enableSorting: false,
          enableHiding: false,
        }),
      ]),
    [onEditAddon, onToggleStatus, handleDeleteSingleAddon, deletingAddonIds]
  );

  const table = useTable({
    features,
    data: filteredAddons,
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

  const handleDeleteSelected = async () => {
    if (isDeletingSelected) return;
    const ids = selectedRows.map((r) => r.original.id);
    if (ids.length === 0) return;

    setIsDeletingSelected(true);
    try {
      if (onDeleteMultiple) {
        await onDeleteMultiple(ids);
      } else if (onDeleteAddon) {
        await Promise.all(ids.map((id) => onDeleteAddon(id)));
      }
      table.resetRowSelection();
      toast.add({
        title: `${ids.length} varian berhasil dihapus`,
      });
    } finally {
      setIsDeletingSelected(false);
    }
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
      a.download = `addons-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${itemsToExport.length} varian`,
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
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-500/30 shadow-none dark:bg-red-500/20 dark:text-red-400"
                onClick={handleDeleteSelected}
                disabled={isDeletingSelected}
              >
                {isDeletingSelected ? (
                  <Spinner className="size-4" />
                ) : (
                  <IconTrash className="size-4" />
                )}
                <span>{isDeletingSelected ? "Menghapus..." : "Hapus"}</span>
              </Button>
            </div>
          ) : (
            <AddonFilterBar
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
                      addon: "Varian / Add-on",
                      category: "Kategori",
                      price: "Harga",
                      linkedProducts: "Terkait Menu",
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
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
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
                      <IconLayersOff className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada varian ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba ubah kata kunci pencarian atau reset filter.
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
