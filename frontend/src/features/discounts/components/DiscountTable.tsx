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
  IconTicket,
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
import {
  formatDiscountPeriod,
  formatDiscountValue,
  formatIDR,
  type DiscountItem,
} from "../data/discountData";
import {
  DiscountFilterBar,
  type DiscountFilterItem,
} from "./DiscountFilterBar";

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

const columnHelper = createColumnHelper<typeof features, DiscountItem>();

interface DiscountTableProps {
  discounts: DiscountItem[];
  isLoading?: boolean;
  onToggleStatus?: (discountId: string) => void;
  onEditDiscount?: (discount: DiscountItem) => void;
  onDeleteDiscount?: (discountId: string) => void | Promise<void | boolean>;
  onDeleteMultiple?: (discountIds: string[]) => void | Promise<void | boolean>;
  onExport?: (selectedDiscounts: DiscountItem[]) => void;
}

export function DiscountTable({
  discounts,
  isLoading,
  onToggleStatus,
  onEditDiscount,
  onDeleteDiscount,
  onDeleteMultiple,
  onExport,
}: DiscountTableProps) {
  const [filters, setFilters] = React.useState<DiscountFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: DiscountFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredDiscounts = React.useMemo(() => {
    return discounts.filter((d) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            d.name.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q) ||
            (d.description || "").toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "mode") {
          if (d.applyMode !== filter.value) return false;
        }

        if (filter.id === "type") {
          if (d.type !== filter.value) return false;
        }

        if (filter.id === "status") {
          const status = d.isActive ? "Active" : "Inactive";
          if (status !== filter.value) return false;
        }
      }
      return true;
    });
  }, [discounts, filters]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "discount", desc: false },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [isDeletingSelected, setIsDeletingSelected] = React.useState(false);
  const [deletingDiscountIds, setDeletingDiscountIds] = React.useState<
    Set<string>
  >(() => new Set());

  const handleDeleteSingleDiscount = React.useCallback(
    async (discountId: string, discountName: string) => {
      if (deletingDiscountIds.has(discountId)) return;
      setDeletingDiscountIds((prev) => new Set(prev).add(discountId));
      try {
        await onDeleteDiscount?.(discountId);
        toast.add({
          title: `Diskon "${discountName}" dihapus`,
        });
      } finally {
        setDeletingDiscountIds((prev) => {
          const next = new Set(prev);
          next.delete(discountId);
          return next;
        });
      }
    },
    [deletingDiscountIds, onDeleteDiscount]
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
          id: "discount",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Diskon</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-2.5 min-w-0 max-w-[280px]">
              <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground border border-border/50">
                <IconTicket className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className="font-medium text-foreground truncate text-sm"
                  title={row.original.name}
                >
                  {row.original.name}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {row.original.code}
                  </span>
                  <span className="text-muted-foreground/40 text-[10px]">
                    •
                  </span>
                  {row.original.applyMode === "automatic" ? (
                    <Badge
                      variant="outline"
                      className="border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] px-1 py-0 h-4 font-normal rounded"
                    >
                      Otomatis
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] px-1 py-0 h-4 font-normal rounded"
                    >
                      Manual
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ),
          enableHiding: false,
        }),
        columnHelper.accessor("value", {
          id: "value",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Potongan</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {formatDiscountValue(row.original.type, row.original.value)}
              </span>
              {row.original.type === "percentage" &&
              row.original.maxDiscount ? (
                <span className="text-[11px] text-muted-foreground truncate whitespace-nowrap">
                  Maks. {formatIDR(row.original.maxDiscount)}
                </span>
              ) : null}
            </div>
          ),
        }),
        columnHelper.accessor("usageCount", {
          id: "applied",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Transaksi</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
              {(row.original.usageCount ?? 0).toLocaleString("id-ID")}{" "}
              <span className="text-xs text-muted-foreground font-normal">
                transaksi
              </span>
            </span>
          ),
        }),
        columnHelper.accessor("endDate", {
          id: "period",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Periode</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDiscountPeriod(
                row.original.startDate,
                row.original.endDate
              )}
            </span>
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
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full text-xs"
                >
                  Aktif
                </Badge>
              );
            }
            return (
              <Badge
                variant="outline"
                className="border-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full text-xs"
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
            const isDeletingThisRow = deletingDiscountIds.has(row.original.id);
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
                    Aksi Diskon
                  </div>
                  <DropdownMenuItem
                    onClick={() => onEditDiscount?.(row.original)}
                  >
                    Ubah data diskon
                  </DropdownMenuItem>
                  {onToggleStatus && (
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(row.original.id)}
                    >
                      {row.original.isActive
                        ? "Nonaktifkan di kasir"
                        : "Aktifkan di kasir"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(row.original.code);
                      toast.add({ title: "ID diskon berhasil disalin" });
                    }}
                  >
                    Salin ID diskon
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isDeletingThisRow}
                    onClick={() => {
                      if (isDeletingThisRow) return;
                      void handleDeleteSingleDiscount(
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
                      "Hapus diskon"
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
    [
      onEditDiscount,
      onToggleStatus,
      handleDeleteSingleDiscount,
      deletingDiscountIds,
    ]
  );

  const table = useTable({
    features,
    data: filteredDiscounts,
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
    if (!selectedCount) return;
    setIsDeletingSelected(true);
    try {
      const selectedIds = selectedRows.map((r) => r.original.id);
      await onDeleteMultiple?.(selectedIds);
      table.resetRowSelection();
      toast.add({
        title: `${selectedCount} diskon berhasil dihapus`,
      });
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleExport = () => {
    const itemsToExport =
      selectedCount > 0
        ? selectedRows.map((r) => r.original)
        : filteredDiscounts;

    if (onExport) {
      onExport(itemsToExport);
    } else {
      const json = JSON.stringify(itemsToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `discounts-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${itemsToExport.length} diskon`,
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
            <DiscountFilterBar
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
                      discount: "Diskon",
                      value: "Potongan",
                      applied: "Transaksi",
                      period: "Periode",
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
        <Table className="w-full">
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
                          : header.id === "status"
                            ? "w-24"
                            : header.id === "applied"
                              ? "w-28"
                              : header.id === "value"
                                ? "w-28"
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
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-8 rounded-md shrink-0" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <Skeleton className="h-4 w-28 sm:w-36" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
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
                    <IconTicket className="size-7 text-muted-foreground/50" />
                    <p className="text-sm font-medium">
                      Tidak ada diskon ditemukan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Coba sesuaikan kata kunci pencarian atau reset filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

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
                size="icon"
                className="size-8"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="size-4" />
                <span className="sr-only">Halaman pertama</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="size-4" />
                <span className="sr-only">Halaman sebelumnya</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="size-4" />
                <span className="sr-only">Halaman berikutnya</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="size-4" />
                <span className="sr-only">Halaman terakhir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
