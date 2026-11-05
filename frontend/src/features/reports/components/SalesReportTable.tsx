import * as React from "react";
import {
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCopy,
  IconDots,
  IconDownload,
  IconEye,
  IconLayoutColumns,
  IconReceipt,
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
import {
  formatIDR,
  formatReportDate,
  type SalesReportItem,
} from "../data/salesReportData";
import {
  SalesReportFilterBar,
  type ReportFilterItem,
} from "./SalesReportFilterBar";

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

const columnHelper = createColumnHelper<typeof features, SalesReportItem>();

interface SalesReportTableProps {
  transactions: SalesReportItem[];
  users?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onViewDetails?: (item: SalesReportItem) => void;
  onExport?: (selectedItems: SalesReportItem[]) => void;
}

export function SalesReportTable({
  transactions,
  users = [],
  isLoading,
  onViewDetails,
  onExport,
}: SalesReportTableProps) {
  const [filters, setFilters] = React.useState<ReportFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: ReportFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            t.transactionNumber.toLowerCase().includes(q) ||
            (t.cashierName && t.cashierName.toLowerCase().includes(q));
          if (!matches) return false;
        }

        if (filter.id === "paymentMethod") {
          if (t.paymentMethod !== filter.value) return false;
        }

        if (filter.id === "cashier") {
          if (t.userId !== filter.value) return false;
        }

        if (filter.id === "status") {
          if (t.status !== filter.value) return false;
        }

        if (filter.id === "datePreset") {
          const txDate = new Date(t.createdAt);
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          if (filter.value === "today") {
            if (txDate < todayStart) return false;
          } else if (filter.value === "yesterday") {
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            if (txDate < yesterdayStart || txDate >= todayStart) return false;
          } else if (filter.value === "last7days") {
            const d7 = new Date(todayStart);
            d7.setDate(d7.getDate() - 7);
            if (txDate < d7) return false;
          } else if (filter.value === "last30days") {
            const d30 = new Date(todayStart);
            d30.setDate(d30.getDate() - 30);
            if (txDate < d30) return false;
          } else if (filter.value === "thisMonth") {
            const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
            if (txDate < mStart) return false;
          }
        }
      }
      return true;
    });
  }, [transactions, filters]);

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

  const handleCopyTransactionNumber = (trxNumber: string) => {
    navigator.clipboard.writeText(trxNumber);
    toast.add({
      title: "No. Transaksi disalin ke clipboard",
    });
  };

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

        columnHelper.accessor("transactionNumber", {
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>No. Transaksi</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
            </Button>
          ),
          cell: ({ row }) => {
            const trxNumber = row.original.transactionNumber;
            return (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {trxNumber}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyTransactionNumber(trxNumber);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-0.5 text-muted-foreground"
                  title="Salin No. Transaksi"
                >
                  <IconCopy className="size-3.5" />
                </button>
              </div>
            );
          },
        }),

        columnHelper.accessor("createdAt", {
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Waktu</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatReportDate(row.original.createdAt)}
            </div>
          ),
        }),

        columnHelper.accessor("cashierName", {
          header: "Kasir",
          cell: ({ row }) => (
            <div className="text-xs font-medium text-foreground">
              {row.original.cashierName || "-"}
            </div>
          ),
        }),

        columnHelper.accessor("paymentMethod", {
          header: "Metode Bayar",
          cell: ({ row }) => {
            const method = row.original.paymentMethod;
            return (
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 font-medium ${
                  method === "QRIS"
                    ? "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                {method}
              </Badge>
            );
          },
        }),

        columnHelper.accessor("subtotalAmount", {
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
                <span>Subtotal (Kotor)</span>
                <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
              </Button>
            </div>
          ),
          cell: ({ row }) => (
            <div className="text-right text-xs tabular-nums text-muted-foreground">
              {formatIDR(row.original.subtotalAmount)}
            </div>
          ),
        }),

        columnHelper.accessor("discountAmount", {
          header: () => <div className="text-right">Diskon</div>,
          cell: ({ row }) => {
            const discount = row.original.discountAmount;
            return (
              <div className="text-right text-xs tabular-nums">
                {discount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    -{formatIDR(discount)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            );
          },
        }),

        columnHelper.accessor("totalAmount", {
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
                <span>Total Bersih</span>
                <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
              </Button>
            </div>
          ),
          cell: ({ row }) => (
            <div className="text-right text-xs font-semibold tabular-nums text-foreground">
              {formatIDR(row.original.totalAmount)}
            </div>
          ),
        }),

        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => {
            const status = row.original.status;
            const isCompleted = status === "COMPLETED";
            return (
              <Badge
                variant={isCompleted ? "default" : "destructive"}
                className="text-xs px-2 py-0.5"
              >
                {isCompleted ? "Selesai" : "Batal"}
              </Badge>
            );
          },
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
                      <span className="sr-only">Buka menu</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => onViewDetails?.(row.original)}
                    className="gap-2 cursor-pointer"
                  >
                    <IconEye className="size-4" />
                    <span>Lihat Rincian</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleCopyTransactionNumber(
                        row.original.transactionNumber
                      )
                    }
                    className="gap-2 cursor-pointer"
                  >
                    <IconCopy className="size-4" />
                    <span>Salin No. Transaksi</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onExport?.([row.original])}
                    className="gap-2 cursor-pointer"
                  >
                    <IconDownload className="size-4" />
                    <span>Ekspor Baris Ini</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
        }),
      ]),
    [onViewDetails, onExport]
  );

  const table = useTable({
    features,
    data: filteredTransactions,
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
      a.download = `sales-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${items.length} data transaksi`,
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
            <SalesReportFilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              users={users}
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
                      transactionNumber: "No. Transaksi",
                      createdAt: "Waktu Transaksi",
                      cashierName: "Kasir",
                      paymentMethod: "Metode Bayar",
                      subtotalAmount: "Subtotal (Gross)",
                      discountAmount: "Diskon",
                      totalAmount: "Total Bersih",
                      status: "Status",
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
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="w-12 px-2">
                      <Skeleton className="size-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group cursor-pointer hover:bg-muted/50"
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
                      <IconReceipt className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada transaksi ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba sesuaikan kata kunci pencarian atau ubah filter
                        periode.
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
