import * as React from "react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowsSort,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDots,
  IconDownload,
  IconEye,
  IconLayoutColumns,
  IconUser,
  IconUserCheck,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { formatIDR } from "../data/salesReportData";
import { type CashierAuditItem } from "../data/cashierAuditData";
import {
  CashierAuditFilterBar,
  type CashierAuditFilterItem,
} from "./CashierAuditFilterBar";

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

const columnHelper = createColumnHelper<typeof features, CashierAuditItem>();

interface CashierAuditTableProps {
  cashiers: CashierAuditItem[];
  isLoading?: boolean;
  onViewDetails?: (item: CashierAuditItem) => void;
  onExport?: (selectedItems: CashierAuditItem[]) => void;
}

export function CashierAuditTable({
  cashiers,
  isLoading,
  onViewDetails,
  onExport,
}: CashierAuditTableProps) {
  const [filters, setFilters] = React.useState<CashierAuditFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: CashierAuditFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredCashiers = React.useMemo(() => {
    return cashiers.filter((c) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            c.cashierName.toLowerCase().includes(q) ||
            c.cashierCode.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "auditStatus") {
          if (c.auditStatus !== filter.value) return false;
        }

        if (filter.id === "accuracy") {
          if (filter.value === "high" && c.accuracyRate < 99.5) return false;
          if (
            filter.value === "medium" &&
            (c.accuracyRate < 98.0 || c.accuracyRate >= 99.5)
          )
            return false;
          if (filter.value === "low" && c.accuracyRate >= 98.0) return false;
        }
      }
      return true;
    });
  }, [cashiers, filters]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({
      voids: true,
      lastAuditDate: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
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
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Pilih semua baris"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Pilih baris ini"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        }),

        columnHelper.accessor("cashierName", {
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Petugas Kasir</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconUser className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  {row.original.cashierName}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {row.original.cashierCode} • {row.original.role}
                </span>
              </div>
            </div>
          ),
        }),

        columnHelper.accessor("totalShifts", {
          header: () => <div className="text-right">Shift</div>,
          cell: ({ row }) => (
            <div className="text-right text-xs tabular-nums text-foreground font-medium">
              {row.original.totalShifts} shift
            </div>
          ),
        }),

        columnHelper.accessor("totalTransactions", {
          header: ({ column }) => (
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span>Transaksi</span>
                <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
              </Button>
            </div>
          ),
          cell: ({ row }) => (
            <div className="text-right text-xs tabular-nums text-muted-foreground">
              {row.original.totalTransactions.toLocaleString("id-ID")} trx
            </div>
          ),
        }),

        columnHelper.accessor("totalSales", {
          header: ({ column }) => (
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span>Total Penjualan</span>
                <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
              </Button>
            </div>
          ),
          cell: ({ row }) => (
            <div className="text-right text-xs tabular-nums font-semibold text-foreground">
              {formatIDR(row.original.totalSales)}
            </div>
          ),
        }),

        columnHelper.accessor("cashDifference", {
          header: ({ column }) => (
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span>Selisih Kas</span>
                <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
              </Button>
            </div>
          ),
          cell: ({ row }) => {
            const diff = row.original.cashDifference;
            if (diff === 0) {
              return (
                <div className="text-right text-xs tabular-nums text-muted-foreground">
                  Rp 0
                </div>
              );
            }
            if (diff > 0) {
              return (
                <div className="text-right text-xs tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatIDR(diff)}
                </div>
              );
            }
            return (
              <div className="text-right text-xs tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                {formatIDR(diff)}
              </div>
            );
          },
        }),

        columnHelper.accessor("accuracyRate", {
          header: ({ column }) => (
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span>Akurasi</span>
                <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
              </Button>
            </div>
          ),
          cell: ({ row }) => {
            const acc = row.original.accuracyRate;
            return (
              <div className="text-right">
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 font-semibold ${
                    acc >= 99.5
                      ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : acc >= 98.0
                        ? "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  {acc}%
                </Badge>
              </div>
            );
          },
        }),

        columnHelper.accessor("voidCount", {
          id: "voids",
          header: () => <div className="text-right">Void / Batal</div>,
          cell: ({ row }) => {
            const count = row.original.voidCount;
            if (count === 0) {
              return (
                <div className="text-right text-xs text-muted-foreground">
                  -
                </div>
              );
            }
            return (
              <div className="text-right text-xs tabular-nums text-rose-600 dark:text-rose-400">
                {count}x ({formatIDR(row.original.voidAmount)})
              </div>
            );
          },
        }),

        columnHelper.accessor("auditStatus", {
          header: "Status Audit",
          cell: ({ row }) => {
            const status = row.original.auditStatus;
            if (status === "NORMAL") {
              return (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                >
                  <IconCheck className="size-3 mr-1" />
                  Aman
                </Badge>
              );
            }
            if (status === "WARNING") {
              return (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                >
                  <IconAlertTriangle className="size-3 mr-1" />
                  Review
                </Badge>
              );
            }
            return (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
              >
                <IconAlertCircle className="size-3 mr-1" />
                Alert
              </Badge>
            );
          },
        }),

        columnHelper.accessor("lastAuditDate", {
          header: "Audit Terakhir",
          cell: ({ row }) => (
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {row.original.lastAuditDate}
            </div>
          ),
        }),

        columnHelper.display({
          id: "actions",
          header: () => <span className="sr-only">Aksi</span>,
          cell: ({ row }) => (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8 p-0">
                      <IconDots className="size-4" />
                      <span className="sr-only">Buka menu aksi</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onViewDetails?.(row.original)}
                  >
                    <IconEye className="mr-2 size-4" />
                    <span>Lihat Detail</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        row.original.cashierCode
                      );
                      toast.add({
                        title: `Kode kasir ${row.original.cashierCode} disalin`,
                      });
                    }}
                  >
                    Salin Kode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        }),
      ]),
    [onViewDetails]
  );

  const table = useTable({
    features,
    data: filteredCashiers,
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
    const items = selectedRows.map((r) => r.original);
    if (onExport) {
      onExport(items);
    } else {
      const json = JSON.stringify(items, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cashier-audit-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${items.length} data audit kasir`,
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
                onClick={handleExportSelected}
              >
                <IconDownload className="size-4" />
                <span>Ekspor</span>
              </Button>
            </div>
          ) : (
            <CashierAuditFilterBar
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
                      cashierName: "Petugas Kasir",
                      totalShifts: "Total Shift",
                      totalTransactions: "Transaksi",
                      totalSales: "Total Penjualan",
                      cashDifference: "Selisih Kas",
                      accuracyRate: "Akurasi Kasir",
                      voids: "Void / Pembatalan",
                      auditStatus: "Status Audit",
                      lastAuditDate: "Audit Terakhir",
                    };
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
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
                Array.from({ length: 5 }).map((_, idx) => (
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
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="w-12 px-2 text-right">
                      <Skeleton className="size-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => onViewDetails?.(row.original)}
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
                        onClick={(e) => {
                          if (
                            cell.column.id === "select" ||
                            cell.column.id === "actions"
                          ) {
                            e.stopPropagation();
                          }
                        }}
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
                      <IconUserCheck className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada data audit kasir ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba sesuaikan kata kunci pencarian atau ubah filter
                        status audit.
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
                htmlFor="rows-per-page-audit"
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
                <SelectTrigger
                  size="sm"
                  className="w-18"
                  id="rows-per-page-audit"
                >
                  <SelectValue placeholder={table.state.pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 50, 100].map((pageSize) => (
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
                <span className="sr-only">Halaman pertama</span>
                <IconChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Halaman sebelumnya</span>
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Halaman selanjutnya</span>
                <IconChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 p-0 sm:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Halaman terakhir</span>
                <IconChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
