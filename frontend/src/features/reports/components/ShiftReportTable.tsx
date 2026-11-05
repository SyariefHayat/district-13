import * as React from "react";
import {
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconClock,
  IconDots,
  IconDownload,
  IconEye,
  IconLayoutColumns,
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
import { formatIDR } from "../data/salesReportData";
import { formatShiftDate, type ShiftReportItem } from "../data/shiftReportData";
import {
  ShiftReportFilterBar,
  type ShiftFilterItem,
} from "./ShiftReportFilterBar";

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

const columnHelper = createColumnHelper<typeof features, ShiftReportItem>();

interface ShiftReportTableProps {
  shifts: ShiftReportItem[];
  users?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onViewDetails?: (item: ShiftReportItem) => void;
  onExport?: (selectedItems: ShiftReportItem[]) => void;
}

export function ShiftReportTable({
  shifts,
  users = [],
  isLoading,
  onViewDetails,
  onExport,
}: ShiftReportTableProps) {
  const [filters, setFilters] = React.useState<ShiftFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: ShiftFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredShifts = React.useMemo(() => {
    return shifts.filter((s) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            s.username.toLowerCase().includes(q) ||
            (s.cashierName && s.cashierName.toLowerCase().includes(q));
          if (!matches) return false;
        }

        if (filter.id === "status") {
          if (s.status !== filter.value) return false;
        }

        if (filter.id === "cashier") {
          if (s.userId !== filter.value) return false;
        }

        if (filter.id === "discrepancy") {
          const diff = s.cashDifference ?? 0;
          if (filter.value === "balanced" && diff !== 0) return false;
          if (filter.value === "discrepant" && diff === 0) return false;
        }

        if (filter.id === "datePreset") {
          const shiftDate = new Date(s.openedAt);
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          if (filter.value === "today") {
            if (shiftDate < todayStart) return false;
          } else if (filter.value === "yesterday") {
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            if (shiftDate < yesterdayStart || shiftDate >= todayStart)
              return false;
          } else if (filter.value === "last7days") {
            const d7 = new Date(todayStart);
            d7.setDate(d7.getDate() - 7);
            if (shiftDate < d7) return false;
          } else if (filter.value === "last30days") {
            const d30 = new Date(todayStart);
            d30.setDate(d30.getDate() - 30);
            if (shiftDate < d30) return false;
          } else if (filter.value === "thisMonth") {
            const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
            if (shiftDate < mStart) return false;
          }
        }
      }
      return true;
    });
  }, [shifts, filters]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "openedAt", desc: true },
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

        columnHelper.accessor("cashierName", {
          header: "Kasir",
          cell: ({ row }) => {
            const cashier = row.original.cashierName || row.original.username;
            return (
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  {cashier}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  @{row.original.username}
                </span>
              </div>
            );
          },
        }),

        columnHelper.accessor("openedAt", {
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 hover:bg-transparent font-medium text-xs text-muted-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span>Waktu Buka</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground/70" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatShiftDate(row.original.openedAt)}
            </div>
          ),
        }),

        columnHelper.accessor("closedAt", {
          header: "Waktu Tutup",
          cell: ({ row }) => {
            const closedAt = row.original.closedAt;
            return closedAt ? (
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatShiftDate(closedAt)}
              </div>
            ) : (
              <Badge
                variant="outline"
                className="text-[11px] border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1 font-normal"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Berjalan</span>
              </Badge>
            );
          },
        }),

        columnHelper.accessor("transactionCount", {
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
            <div className="text-right text-xs tabular-nums text-foreground font-medium">
              {row.original.transactionCount} trx
            </div>
          ),
        }),

        columnHelper.accessor("openingCash", {
          header: () => <div className="text-right">Modal Awal</div>,
          cell: ({ row }) => (
            <div className="text-right text-xs tabular-nums text-muted-foreground">
              {formatIDR(row.original.openingCash)}
            </div>
          ),
        }),

        columnHelper.accessor("expectedCash", {
          header: () => <div className="text-right">Kas Sistem</div>,
          cell: ({ row }) => (
            <div className="text-right text-xs tabular-nums text-muted-foreground">
              {formatIDR(row.original.expectedCash)}
            </div>
          ),
        }),

        columnHelper.accessor("closingCash", {
          header: () => <div className="text-right">Kas Akhir</div>,
          cell: ({ row }) => {
            const closing = row.original.closingCash;
            return (
              <div className="text-right text-xs tabular-nums font-medium text-foreground">
                {closing !== null ? formatIDR(closing) : "-"}
              </div>
            );
          },
        }),

        columnHelper.accessor("cashDifference", {
          header: () => <div className="text-right">Selisih</div>,
          cell: ({ row }) => {
            const diff = row.original.cashDifference;
            if (row.original.status === "OPEN" || diff === null) {
              return (
                <div className="text-right text-xs text-muted-foreground">
                  -
                </div>
              );
            }
            if (diff === 0) {
              return (
                <div className="text-right text-xs tabular-nums text-muted-foreground font-medium">
                  Rp 0
                </div>
              );
            }
            if (diff > 0) {
              return (
                <div className="text-right text-xs tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{formatIDR(diff)}
                </div>
              );
            }
            return (
              <div className="text-right text-xs tabular-nums text-red-600 dark:text-red-400 font-semibold">
                {formatIDR(diff)}
              </div>
            );
          },
        }),

        columnHelper.accessor("status", {
          header: "Status",
          cell: ({ row }) => {
            const isOpen = row.original.status === "OPEN";
            return (
              <Badge
                variant={isOpen ? "default" : "outline"}
                className={`text-xs px-2 py-0.5 ${
                  isOpen
                    ? "bg-emerald-600 hover:bg-emerald-600/90 text-white"
                    : "border-slate-200 text-slate-600 dark:text-slate-300"
                }`}
              >
                {isOpen ? "Aktif" : "Selesai"}
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
    data: filteredShifts,
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
      a.download = `shift-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${items.length} data shift`,
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
            <ShiftReportFilterBar
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
                      cashierName: "Kasir",
                      openedAt: "Waktu Buka",
                      closedAt: "Waktu Tutup",
                      transactionCount: "Transaksi",
                      openingCash: "Modal Awal",
                      expectedCash: "Kas Sistem",
                      closingCash: "Kas Akhir",
                      cashDifference: "Selisih",
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
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
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
                      <IconClock className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada data shift ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba sesuaikan pencarian atau reset filter aktif.
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
                htmlFor="rows-per-page-shift"
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
                  id="rows-per-page-shift"
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
