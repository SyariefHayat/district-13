import * as React from "react";
import {
  IconArrowsSort,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconClock,
  IconCopy,
  IconDots,
  IconDownload,
  IconEdit,
  IconId,
  IconLayoutColumns,
  IconPlayerPlay,
  IconRotate2,
  IconTrash,
  IconUser,
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
import { Spinner } from "@/components/ui/spinner";
import {
  formatScheduleDate,
  SCHEDULE_STATUS_CONFIG,
  SHIFT_TYPE_CONFIG,
  type ScheduleItem,
  type ScheduleStatus,
} from "../data/scheduleData";
import {
  ScheduleFilterBar,
  type ScheduleFilterItem,
} from "./ScheduleFilterBar";

const ROLE_BADGE_CLASSES: Record<string, string> = {
  OWNER:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  ADMIN:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  CASHIER:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
};

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

const columnHelper = createColumnHelper<typeof features, ScheduleItem>();

interface ScheduleTableProps {
  schedules: ScheduleItem[];
  isLoading?: boolean;
  onEditSchedule?: (schedule: ScheduleItem) => void;
  onUpdateStatus?: (scheduleId: string, status: ScheduleStatus) => void;
  onDeleteSchedule?: (
    scheduleId: string
  ) => void | boolean | Promise<void | boolean>;
  onDeleteMultiple?: (
    scheduleIds: string[]
  ) => void | boolean | Promise<void | boolean>;
  onExport?: (selected: ScheduleItem[]) => void;
}

export function ScheduleTable({
  schedules,
  isLoading,
  onEditSchedule,
  onUpdateStatus,
  onDeleteSchedule,
  onDeleteMultiple,
  onExport,
}: ScheduleTableProps) {
  const [filters, setFilters] = React.useState<ScheduleFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: ScheduleFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((schedule) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "employee") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            schedule.userName.toLowerCase().includes(q) ||
            schedule.userId.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "shiftType") {
          if (schedule.shiftType !== filter.value) return false;
        }

        if (filter.id === "status") {
          if (schedule.status !== filter.value) return false;
        }

        if (filter.id === "date") {
          if (schedule.date !== filter.value) return false;
        }
      }
      return true;
    });
  }, [schedules, filters]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isDeletingSelected, setIsDeletingSelected] = React.useState(false);
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const handleDeleteSingle = React.useCallback(
    async (id: string, staffName: string) => {
      if (deletingIds.has(id) || isDeletingSelected) return;
      setDeletingIds((prev) => new Set(prev).add(id));
      try {
        const result = await onDeleteSchedule?.(id);
        if (result !== false) {
          toast.add({
            title: `Jadwal shift "${staffName}" berhasil dihapus`,
          });
        }
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [deletingIds, isDeletingSelected, onDeleteSchedule]
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
                disabled={isDeletingSelected || deletingIds.size > 0}
              />
            </div>
          ),
          cell: ({ row }) => {
            const isDeleting = deletingIds.has(row.original.id);
            return (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Pilih baris"
                  disabled={isDeleting || isDeletingSelected}
                />
              </div>
            );
          },
          enableSorting: false,
          enableHiding: false,
        }),
        columnHelper.accessor("userName", {
          id: "employee",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Karyawan</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const initial = row.original.userName.charAt(0).toUpperCase();
            const roleClass =
              ROLE_BADGE_CLASSES[row.original.userRole] ||
              "bg-muted text-foreground";
            return (
              <div className="flex items-center gap-3 min-w-0 py-0.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground font-semibold text-sm border">
                  {initial || <IconUser className="size-4" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground truncate">
                      {row.original.userName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${roleClass}`}
                    >
                      {row.original.userRole}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {row.original.userId}
                  </span>
                </div>
              </div>
            );
          },
          enableHiding: false,
        }),
        columnHelper.accessor("shiftType", {
          id: "shift",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Shift & Jam Kerja</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const cfg = SHIFT_TYPE_CONFIG[row.original.shiftType];
            return (
              <div className="flex flex-col gap-1 py-0.5">
                <span
                  className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}
                >
                  {cfg.label.split(" ")[0]} {cfg.label.split(" ")[1] || ""}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {row.original.startTime} - {row.original.endTime}
                </span>
              </div>
            );
          },
        }),
        columnHelper.accessor("date", {
          id: "date",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Tanggal</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm text-foreground">
              {formatScheduleDate(row.original.date)}
            </span>
          ),
        }),
        columnHelper.accessor("status", {
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
            const cfg = SCHEDULE_STATUS_CONFIG[row.original.status];
            return (
              <div className="flex items-center">
                <Badge
                  variant="outline"
                  className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${cfg.className}`}
                >
                  {cfg.label}
                </Badge>
              </div>
            );
          },
        }),
        columnHelper.accessor("notes", {
          id: "notes",
          header: "Catatan",
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
              {row.original.notes || "-"}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => null,
          cell: ({ row }) => {
            const schedule = row.original;
            const isDeletingThisRow = deletingIds.has(schedule.id);

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
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Aksi Jadwal
                  </div>
                  <DropdownMenuItem
                    onClick={() => onEditSchedule?.(schedule)}
                    disabled={isDeletingThisRow || isDeletingSelected}
                    className="gap-2"
                  >
                    <IconEdit className="size-4 text-muted-foreground" />
                    <span>Ubah data jadwal</span>
                  </DropdownMenuItem>

                  {schedule.status !== "ON_DUTY" && (
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus?.(schedule.id, "ON_DUTY")}
                      disabled={isDeletingThisRow || isDeletingSelected}
                      className="gap-2"
                    >
                      <IconPlayerPlay className="size-4 text-emerald-600" />
                      <span>Mulai shift</span>
                    </DropdownMenuItem>
                  )}

                  {schedule.status !== "COMPLETED" && (
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus?.(schedule.id, "COMPLETED")}
                      disabled={isDeletingThisRow || isDeletingSelected}
                      className="gap-2"
                    >
                      <IconCheck className="size-4 text-sky-600" />
                      <span>Tandai selesai</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(schedule.userName);
                      toast.add({ title: "Nama staf berhasil disalin" });
                    }}
                    className="gap-2 text-xs"
                  >
                    <IconCopy className="size-4 text-muted-foreground" />
                    <span>Salin nama staf</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(schedule.id);
                      toast.add({ title: "ID jadwal berhasil disalin" });
                    }}
                    className="gap-2 text-xs"
                  >
                    <IconId className="size-4 text-muted-foreground" />
                    <span>Salin ID jadwal</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isDeletingThisRow || isDeletingSelected}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isDeletingThisRow || isDeletingSelected) return;
                      void handleDeleteSingle(schedule.id, schedule.userName);
                    }}
                    className="gap-2"
                  >
                    {isDeletingThisRow ? (
                      <>
                        <Spinner className="size-4" />
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <IconTrash className="size-4" />
                        <span>Hapus jadwal</span>
                      </>
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
      deletingIds,
      isDeletingSelected,
      handleDeleteSingle,
      onEditSchedule,
      onUpdateStatus,
    ]
  );

  const table = useTable({
    features,
    data: filteredSchedules,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row: ScheduleItem) => row.id,
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
    if (!selectedCount || isDeletingSelected) return;
    setIsDeletingSelected(true);
    try {
      const selectedIds = selectedRows.map((r) => r.original.id);
      await onDeleteMultiple?.(selectedIds);
      table.resetRowSelection();
      toast.add({
        title: `${selectedIds.length} jadwal berhasil dihapus`,
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
      a.download = `schedules-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${itemsToExport.length} jadwal shift`,
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
            <ScheduleFilterBar
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
                      employee: "Karyawan",
                      shift: "Shift & Jam Kerja",
                      date: "Tanggal",
                      status: "Status",
                      notes: "Catatan",
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
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="w-12 px-2 text-right">
                      <Skeleton className="size-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isRowDeleting = deletingIds.has(row.original.id);
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
                      <IconClock className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada jadwal shift ditemukan
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
                <span className="sr-only">Ke halaman selanjutnya</span>
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
