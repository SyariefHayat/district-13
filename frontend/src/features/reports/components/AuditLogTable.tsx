import * as React from "react";
import {
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDots,
  IconDownload,
  IconEye,
  IconHistory,
  IconLayoutColumns,
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
import { type AuditLogItem } from "../data/auditLogData";
import {
  AuditLogFilterBar,
  type AuditLogFilterItem,
} from "./AuditLogFilterBar";

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

const columnHelper = createColumnHelper<typeof features, AuditLogItem>();

interface AuditLogTableProps {
  logs: AuditLogItem[];
  isLoading?: boolean;
  onViewDetails?: (item: AuditLogItem) => void;
  onExport?: (selectedItems: AuditLogItem[]) => void;
}

export function AuditLogTable({
  logs,
  isLoading,
  onViewDetails,
  onExport,
}: AuditLogTableProps) {
  const [filters, setFilters] = React.useState<AuditLogFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: AuditLogFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            log.description.toLowerCase().includes(q) ||
            log.userName.toLowerCase().includes(q) ||
            log.action.toLowerCase().includes(q) ||
            (log.entityId && log.entityId.toLowerCase().includes(q));
          if (!matches) return false;
        }

        if (filter.id === "entityType") {
          if (log.entityType !== filter.value) return false;
        }

        if (filter.id === "actionCategory") {
          if (
            filter.value === "TRANSACTION" &&
            !log.action.startsWith("TRANSACTION")
          ) {
            return false;
          }
          if (
            filter.value === "SHIFT_CASH" &&
            !log.action.startsWith("SHIFT") &&
            !log.action.startsWith("CASH")
          ) {
            return false;
          }
          if (
            filter.value === "DATA" &&
            !log.action.startsWith("PRODUCT") &&
            !log.action.startsWith("CATEGORY") &&
            !log.action.startsWith("INVENTORY") &&
            !log.action.startsWith("USER")
          ) {
            return false;
          }
          if (filter.value === "AUTH" && !log.action.startsWith("AUTH")) {
            return false;
          }
        }
      }
      return true;
    });
  }, [logs, filters]);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const getActionBadgeClass = (action: string) => {
    if (
      action.includes("VOID") ||
      action.includes("FAILED") ||
      action.includes("DELETED")
    ) {
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300";
    }
    if (
      action.includes("CREATED") ||
      action.includes("SUCCEEDED") ||
      action.includes("OPENED")
    ) {
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    }
    if (
      action.includes("UPDATED") ||
      action.includes("CHANGED") ||
      action.includes("CLOSED")
    ) {
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
    }
    return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
  };

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
            <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {row.original.createdAt}
            </div>
          ),
        }),

        columnHelper.accessor("userName", {
          header: "Pengguna / Aktor",
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconUser className="size-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  {row.original.userName}
                </span>
                {row.original.userRole && (
                  <span className="text-[11px] text-muted-foreground">
                    {row.original.userRole}
                  </span>
                )}
              </div>
            </div>
          ),
        }),

        columnHelper.accessor("action", {
          header: "Aksi",
          cell: ({ row }) => {
            const action = row.original.action;
            return (
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 font-mono ${getActionBadgeClass(action)}`}
              >
                {action}
              </Badge>
            );
          },
        }),

        columnHelper.accessor("entityType", {
          header: "Entitas",
          cell: ({ row }) => (
            <Badge variant="outline" className="text-xs px-2 py-0.5 font-mono">
              {row.original.entityType}
            </Badge>
          ),
        }),

        columnHelper.accessor("description", {
          header: "Keterangan Aktivitas",
          cell: ({ row }) => (
            <div className="text-xs text-foreground line-clamp-1 max-w-md">
              {row.original.description}
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
                        JSON.stringify(row.original, null, 2)
                      );
                      toast.add({
                        title: "Data audit log disalin",
                      });
                    }}
                  >
                    Salin Log (JSON)
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
    data: filteredLogs,
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
      a.download = `audit-log-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${items.length} catatan audit log`,
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
            <AuditLogFilterBar
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
                      createdAt: "Waktu Tercatat",
                      userName: "Pengguna / Aktor",
                      action: "Aksi",
                      entityType: "Entitas",
                      description: "Keterangan",
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
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-64" />
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
                      <IconHistory className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada catatan audit log ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba sesuaikan kata kunci pencarian atau ubah filter
                        entitas.
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
                htmlFor="rows-per-page-audit-log"
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
                  id="rows-per-page-audit-log"
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
