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
  isLoading?: boolean;
  onToggleStatus?: (addonId: string) => void;
  onEditAddon?: (addon: AddonItem) => void;
  onDeleteAddon?: (addonId: string) => void | boolean | Promise<void | boolean>;
  onDeleteMultiple?: (
    addonIds: string[]
  ) => void | boolean | Promise<void | boolean>;
  onExport?: (selectedAddons: AddonItem[]) => void;
}

export function AddonTable({
  addons,
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

        if (filter.id === "addon" || (filter.id as string) === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            addon.name.toLowerCase().includes(q) ||
            addon.id.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "status") {
          const val = filter.value.toLowerCase();
          if (val === "active" && !addon.isActive) return false;
          if (val === "inactive" && addon.isActive) return false;
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

        if (filter.id === "linkedProducts") {
          const count = addon.linkedProductsCount ?? 0;
          if (filter.value === "linked" && count <= 0) return false;
          if (filter.value === "unlinked" && count > 0) return false;
          if (filter.value === "frequent" && count < 10) return false;
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
      if (deletingAddonIds.has(addonId) || isDeletingSelected) return;
      setDeletingAddonIds((prev) => new Set(prev).add(addonId));
      try {
        const result = await onDeleteAddon?.(addonId);
        if (result !== false) {
          toast.add({
            title: `Add-on "${addonName}" berhasil dihapus`,
          });
        }
      } finally {
        setDeletingAddonIds((prev) => {
          const next = new Set(prev);
          next.delete(addonId);
          return next;
        });
      }
    },
    [deletingAddonIds, isDeletingSelected, onDeleteAddon]
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
                disabled={isDeletingSelected || deletingAddonIds.size > 0}
              />
            </div>
          ),
          cell: ({ row }) => {
            const isDeletingThisRow = deletingAddonIds.has(row.original.id);
            return (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Pilih baris"
                  disabled={isDeletingThisRow || isDeletingSelected}
                />
              </div>
            );
          },
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
              <span>Add-on</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex flex-col min-w-0 py-0.5">
              <span className="font-medium text-foreground truncate">
                {row.original.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {row.original.id}
              </span>
            </div>
          ),
          enableHiding: false,
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
              <span>Harga</span>
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
              <span>Menu Terkait</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <IconLink className="size-3.5 text-muted-foreground/70" />
              <span className="tabular-nums font-medium text-foreground">
                {row.original.linkedProductsCount}
              </span>
              <span>menu</span>
            </div>
          ),
        }),
        columnHelper.accessor((row) => (row.isActive ? "Aktif" : "Nonaktif"), {
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
                  Aktif
                </Badge>
              );
            }
            return (
              <Badge
                variant="outline"
                className="border-muted text-muted-foreground font-medium px-2.5 py-0.5 rounded-full text-xs"
              >
                Nonaktif
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
                      disabled={isDeletingThisRow || isDeletingSelected}
                    >
                      {isDeletingThisRow ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        <IconDots className="size-4" />
                      )}
                      <span className="sr-only">Buka menu aksi</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Aksi Add-on
                  </div>
                  <DropdownMenuItem
                    disabled={isDeletingThisRow || isDeletingSelected}
                    onClick={() => onEditAddon?.(row.original)}
                  >
                    Ubah data add-on
                  </DropdownMenuItem>
                  {onToggleStatus && (
                    <DropdownMenuItem
                      disabled={isDeletingThisRow || isDeletingSelected}
                      onClick={() => onToggleStatus(row.original.id)}
                    >
                      {row.original.isActive
                        ? "Nonaktifkan add-on"
                        : "Aktifkan add-on"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(row.original.id);
                      toast.add({ title: "ID add-on berhasil disalin" });
                    }}
                  >
                    Salin ID add-on
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isDeletingThisRow || isDeletingSelected}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isDeletingThisRow || isDeletingSelected) return;
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
                      "Hapus add-on"
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
    if (isDeletingSelected || deletingAddonIds.size > 0) return;
    const ids = selectedRows.map((r) => r.original.id);
    if (ids.length === 0) return;

    setIsDeletingSelected(true);
    try {
      let ok = true;
      if (onDeleteMultiple) {
        const res = await onDeleteMultiple(ids);
        if (res === false) ok = false;
      } else if (onDeleteAddon) {
        const results = await Promise.all(ids.map((id) => onDeleteAddon(id)));
        if (results.some((r) => r === false)) ok = false;
      }
      table.resetRowSelection();
      if (ok) {
        toast.add({
          title: `${ids.length} add-on berhasil dihapus`,
        });
      }
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
        title: `Berhasil mengekspor ${itemsToExport.length} add-on`,
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
                className="gap-1.5 bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-500/30 shadow-none dark:bg-red-500/20 dark:text-red-400 disabled:opacity-50 disabled:pointer-events-none"
                onClick={(e) => {
                  e.preventDefault();
                  void handleDeleteSelected();
                }}
                disabled={isDeletingSelected || deletingAddonIds.size > 0}
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
                    <span>Kolom</span>
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
                      addon: "Add-on",
                      price: "Harga",
                      linkedProducts: "Menu Terkait",
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
                      <div className="flex flex-col gap-1.5 min-w-0 py-0.5">
                        <Skeleton className="h-4 w-32 sm:w-44" />
                        <Skeleton className="h-3 w-16" />
                      </div>
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
                table.getRowModel().rows.map((row) => {
                  const isRowDeleting = deletingAddonIds.has(row.original.id);
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`hover:bg-muted/30 data-[state=selected]:bg-muted/50 transition-opacity ${
                        isRowDeleting ? "opacity-50 pointer-events-none" : ""
                      }`}
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <IconLayersOff className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada add-on ditemukan
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
            {table.getFilteredSelectedRowModel().rows.length} dari{" "}
            {table.getFilteredRowModel().rows.length} baris dipilih.
          </div>
          <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="rows-per-page"
                className="text-sm font-medium whitespace-nowrap"
              >
                Baris per halaman
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
              Halaman {table.state.pagination.pageIndex + 1} dari{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                className="hidden size-8 p-0 sm:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ke halaman pertama</span>
                <IconChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ke halaman sebelumnya</span>
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ke halaman berikutnya</span>
                <IconChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 p-0 sm:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ke halaman terakhir</span>
                <IconChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
