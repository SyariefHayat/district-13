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
  IconReceiptOff,
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
  formatSaleDate,
  type SaleTransaction,
} from "../data/salesData";
import { SalesFilterBar, type SalesFilterItem } from "./SalesFilterBar";

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

const columnHelper = createColumnHelper<typeof features, SaleTransaction>();

interface SalesTableProps {
  transactions: SaleTransaction[];
  isLoading?: boolean;
  onViewDetail: (tx: SaleTransaction) => void;
  onVoidClick: (tx: SaleTransaction) => void;
  onExport?: (selectedTransactions: SaleTransaction[]) => void;
}

export function SalesTable({
  transactions,
  isLoading,
  onViewDetail,
  onVoidClick,
  onExport,
}: SalesTableProps) {
  const [filters, setFilters] = React.useState<SalesFilterItem[]>([]);
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

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: SalesFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "transactionNumber") {
          const q = filter.value.trim().toLowerCase();
          if (!tx.transactionNumber.toLowerCase().includes(q)) return false;
        }

        if (filter.id === "cashier") {
          const q = filter.value.trim().toLowerCase();
          if (!(tx.cashierName || "").toLowerCase().includes(q)) return false;
        }

        if (filter.id === "status") {
          if (tx.status !== filter.value) return false;
        }

        if (filter.id === "paymentMethod") {
          if (tx.paymentMethod !== filter.value) return false;
        }

        if (filter.id === "transactionTime") {
          if (!tx.createdAt) return false;
          const txDate = new Date(tx.createdAt);
          const now = new Date();

          if (filter.value === "TODAY") {
            const isToday =
              txDate.getDate() === now.getDate() &&
              txDate.getMonth() === now.getMonth() &&
              txDate.getFullYear() === now.getFullYear();
            if (!isToday) return false;
          } else if (filter.value === "YESTERDAY") {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday =
              txDate.getDate() === yesterday.getDate() &&
              txDate.getMonth() === yesterday.getMonth() &&
              txDate.getFullYear() === yesterday.getFullYear();
            if (!isYesterday) return false;
          } else if (filter.value === "LAST_7_DAYS") {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            if (txDate < sevenDaysAgo) return false;
          } else if (filter.value === "THIS_MONTH") {
            const isThisMonth =
              txDate.getMonth() === now.getMonth() &&
              txDate.getFullYear() === now.getFullYear();
            if (!isThisMonth) return false;
          } else if (filter.value === "SESSION_MORNING") {
            const h = txDate.getHours();
            if (h < 6 || h >= 12) return false;
          } else if (filter.value === "SESSION_AFTERNOON") {
            const h = txDate.getHours();
            if (h < 12 || h >= 18) return false;
          } else if (filter.value === "SESSION_NIGHT") {
            const h = txDate.getHours();
            if (h < 18 || h >= 24) return false;
          } else if (filter.value.startsWith("DATE:")) {
            const selectedDateStr = filter.value.replace("DATE:", "");
            const yr = txDate.getFullYear();
            const mo = String(txDate.getMonth() + 1).padStart(2, "0");
            const da = String(txDate.getDate()).padStart(2, "0");
            const txDateStr = `${yr}-${mo}-${da}`;
            if (txDateStr !== selectedDateStr) return false;
          }
        }
      }
      return true;
    });
  }, [transactions, filters]);

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={table.getIsAllPageRowsSelected() === true}
                indeterminate={table.getIsSomePageRowsSelected()}
                onCheckedChange={(val) =>
                  table.toggleAllPageRowsSelected(!!val)
                }
                aria-label="Pilih semua baris"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(val) => row.toggleSelected(!!val)}
                aria-label={`Pilih transaksi ${row.original.transactionNumber}`}
              />
            </div>
          ),
          enableSorting: false,
          enableHiding: false,
        }),

        columnHelper.accessor("transactionNumber", {
          id: "transactionNumber",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>No. Transaksi</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onViewDetail(row.original)}
                className="font-mono text-xs font-semibold text-foreground hover:underline hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <IconReceipt className="size-3.5 text-muted-foreground" />
                <span>{row.original.transactionNumber}</span>
              </button>
            </div>
          ),
        }),

        columnHelper.accessor("createdAt", {
          id: "createdAt",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Waktu Transaksi</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatSaleDate(row.original.createdAt)}
            </span>
          ),
        }),

        columnHelper.accessor("cashierName", {
          id: "cashierName",
          header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
              Kasir
            </span>
          ),
          cell: ({ row }) => (
            <span className="text-xs text-foreground">
              {row.original.cashierName || "Kasir"}
            </span>
          ),
        }),

        columnHelper.accessor("paymentMethod", {
          id: "paymentMethod",
          header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
              Metode Bayar
            </span>
          ),
          cell: ({ row }) => {
            const method = row.original.paymentMethod;
            return method === "QRIS" ? (
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                QRIS
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
              >
                Tunai
              </Badge>
            );
          },
        }),

        columnHelper.accessor("totalAmount", {
          id: "totalAmount",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Total Belanja</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div>
              <span className="text-xs font-semibold text-foreground">
                {formatIDR(row.original.totalAmount)}
              </span>
              {row.original.discountAmount > 0 && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Hemat {formatIDR(row.original.discountAmount)}
                </div>
              )}
            </div>
          ),
        }),

        columnHelper.accessor("status", {
          id: "status",
          header: () => (
            <span className="text-xs font-semibold text-muted-foreground">
              Status
            </span>
          ),
          cell: ({ row }) => {
            const isCompleted = row.original.status === "COMPLETED";
            return isCompleted ? (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
              >
                Selesai
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-destructive/30 bg-destructive/10 text-destructive font-medium"
              >
                Dibatalkan
              </Badge>
            );
          },
        }),

        columnHelper.display({
          id: "actions",
          header: () => null,
          cell: ({ row }) => {
            const tx = row.original;
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
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Aksi Transaksi
                  </div>
                  <DropdownMenuItem
                    onClick={() => onViewDetail(tx)}
                    className="gap-2 cursor-pointer"
                  >
                    <IconEye className="size-4 text-muted-foreground" />
                    <span>Lihat Rincian Struk</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(tx.transactionNumber);
                      toast.add({ title: "No. Transaksi berhasil disalin" });
                    }}
                    className="gap-2 text-xs"
                  >
                    <IconCopy className="size-4 text-muted-foreground" />
                    <span>Salin No. Transaksi</span>
                  </DropdownMenuItem>

                  {tx.status === "COMPLETED" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onVoidClick(tx)}
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <IconReceiptOff className="size-4" />
                        <span>Void Transaksi</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
          enableSorting: false,
          enableHiding: false,
        }),
      ]),
    [onViewDetail, onVoidClick]
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
    const itemsToExport = selectedRows.map((r) => r.original);
    if (onExport) {
      onExport(itemsToExport);
    } else {
      const json = JSON.stringify(itemsToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${itemsToExport.length} transaksi`,
      });
    }
  };

  return (
    <div className="px-4 md:px-6">
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
        {/* Top Toolbar (identical layout to UserTable) */}
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
            <SalesFilterBar
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
                className="gap-1.5"
              >
                <IconX className="size-4" />
                <span>Batal</span>
              </Button>
            ) : (
              filters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="gap-1.5"
                >
                  <IconRotate2 className="size-4" />
                  <span>Reset filter</span>
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
                      transactionNumber: "No. Transaksi",
                      createdAt: "Waktu Transaksi",
                      cashierName: "Kasir",
                      paymentMethod: "Metode Bayar",
                      totalAmount: "Total Belanja",
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

        {/* Table Content */}
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
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
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
                    className="hover:bg-muted/30 data-[state=selected]:bg-muted/50 transition-colors"
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
                      <IconReceipt className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada transaksi ditemukan
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
        </div>

        {/* Pagination Footer (identical layout to UserTable) */}
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
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ke halaman sebelumnya</span>
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8 p-0"
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
