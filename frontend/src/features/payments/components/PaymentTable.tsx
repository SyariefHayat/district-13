import * as React from "react";
import {
  IconArrowsSort,
  IconBuildingBank,
  IconCash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCreditCard,
  IconDeviceMobile,
  IconDots,
  IconDownload,
  IconEye,
  IconLayoutColumns,
  IconPencil,
  IconQrcode,
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
  formatPaymentAmount,
  PAYMENT_TYPE_LABELS,
  type PaymentMethodItem,
  type PaymentType,
} from "../data/paymentData";
import { PaymentFilterBar, type PaymentFilterItem } from "./PaymentFilterBar";

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

const columnHelper = createColumnHelper<typeof features, PaymentMethodItem>();

function getPaymentTypeIcon(type: PaymentType) {
  switch (type) {
    case "CASH":
      return IconCash;
    case "QRIS":
      return IconQrcode;
    case "CARD":
      return IconCreditCard;
    case "E_WALLET":
      return IconDeviceMobile;
    case "TRANSFER":
      return IconBuildingBank;
    default:
      return IconCreditCard;
  }
}

interface PaymentTableProps {
  payments: PaymentMethodItem[];
  isLoading?: boolean;
  onToggleStatus?: (paymentId: string) => void;
  onEditPayment?: (payment: PaymentMethodItem) => void;
  onDeletePayment?: (paymentId: string) => void | Promise<void>;
  onDeleteMultiple?: (paymentIds: string[]) => void | Promise<void>;
  onViewDetails?: (payment: PaymentMethodItem) => void;
  onExport?: (selectedPayments: PaymentMethodItem[]) => void;
}

export function PaymentTable({
  payments,
  isLoading,
  onToggleStatus,
  onEditPayment,
  onDeletePayment,
  onDeleteMultiple,
  onViewDetails,
  onExport,
}: PaymentTableProps) {
  const [filters, setFilters] = React.useState<PaymentFilterItem[]>([]);

  const handleClearAllFilters = () => {
    setFilters([]);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const handleFiltersChange = (newFilters: PaymentFilterItem[]) => {
    setFilters(newFilters);
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    );
  };

  const filteredPayments = React.useMemo(() => {
    return payments.filter((item) => {
      for (const filter of filters) {
        if (!filter.value) continue;

        if (filter.id === "search") {
          const q = filter.value.trim().toLowerCase();
          const matches =
            item.name.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.provider.toLowerCase().includes(q) ||
            item.accountNumber.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (filter.id === "status") {
          if (item.status !== filter.value) return false;
        }

        if (filter.id === "type") {
          if (item.type !== filter.value) return false;
        }

        if (filter.id === "fee") {
          if (filter.value === "zero" && item.feePercentage !== 0) return false;
          if (
            filter.value === "low" &&
            (item.feePercentage <= 0 || item.feePercentage > 1.0)
          ) {
            return false;
          }
          if (filter.value === "standard" && item.feePercentage <= 1.0) {
            return false;
          }
        }

        if (filter.id === "settlement") {
          const lowerSettlement = item.settlementTime.toLowerCase();
          if (
            filter.value === "realtime" &&
            !lowerSettlement.includes("real-time")
          ) {
            return false;
          }
          if (filter.value === "t1" && !lowerSettlement.includes("t+1")) {
            return false;
          }
          if (filter.value === "t2" && !lowerSettlement.includes("t+2")) {
            return false;
          }
        }
      }
      return true;
    });
  }, [payments, filters]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({
      provider: false,
      settlement: false,
    });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "volume", desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isDeletingSelected, setIsDeletingSelected] = React.useState(false);
  const [deletingPaymentIds, setDeletingPaymentIds] = React.useState<
    Set<string>
  >(() => new Set());

  const handleDeleteSinglePayment = React.useCallback(
    async (paymentId: string, paymentName: string) => {
      if (deletingPaymentIds.has(paymentId)) return;
      setDeletingPaymentIds((prev) => new Set(prev).add(paymentId));
      try {
        await onDeletePayment?.(paymentId);
        toast.add({
          title: `Metode "${paymentName}" berhasil dihapus`,
        });
      } finally {
        setDeletingPaymentIds((prev) => {
          const next = new Set(prev);
          next.delete(paymentId);
          return next;
        });
      }
    },
    [deletingPaymentIds, onDeletePayment]
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
                aria-label="Pilih semua baris"
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
          id: "method",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Metode Pembayaran</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const Icon = getPaymentTypeIcon(row.original.type);
            return (
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground text-sm truncate">
                    {row.original.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {row.original.code} · {row.original.provider}
                  </span>
                </div>
              </div>
            );
          },
          enableHiding: false,
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
              <span>Tipe</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => {
            const type = row.original.type;
            const typeColors: Record<PaymentType, string> = {
              CASH: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
              QRIS: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
              CARD: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
              E_WALLET:
                "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
              TRANSFER:
                "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
            };
            return (
              <Badge
                variant="outline"
                className={`font-medium px-2 py-0.5 rounded-md text-xs ${typeColors[type] || ""}`}
              >
                {PAYMENT_TYPE_LABELS[type]}
              </Badge>
            );
          },
        }),
        columnHelper.accessor("feePercentage", {
          id: "fee",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Biaya MDR</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-sm font-medium text-foreground tabular-nums">
              {row.original.feePercentage === 0
                ? "Gratis (0%)"
                : `${row.original.feePercentage.toFixed(1)}%`}
            </span>
          ),
        }),
        columnHelper.accessor("totalVolume", {
          id: "volume",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Volume & Trx</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatPaymentAmount(row.original.totalVolume)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(row.original.transactionCount ?? 0).toLocaleString("id-ID")}{" "}
                trx
              </span>
            </div>
          ),
        }),
        columnHelper.accessor("accountNumber", {
          id: "provider",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Akun / ID</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {row.original.accountNumber}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {row.original.provider}
              </span>
            </div>
          ),
        }),
        columnHelper.accessor("settlementTime", {
          id: "settlement",
          header: ({ column }) => (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 gap-1 font-medium hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => column.toggleSorting()}
            >
              <span>Settlement</span>
              <IconArrowsSort className="size-3.5 text-muted-foreground" />
            </Button>
          ),
          cell: ({ row }) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {row.original.settlementTime}
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
            const status = row.original.status;
            if (status === "ACTIVE" || row.original.isActive) {
              return (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-0.5 rounded-full text-xs"
                >
                  Aktif
                </Badge>
              );
            }
            if (status === "MAINTENANCE") {
              return (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium px-2.5 py-0.5 rounded-full text-xs"
                >
                  Maintenance
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
            const isDeleting = deletingPaymentIds.has(row.original.id);
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
                    onClick={() => onViewDetails?.(row.original)}
                    className="gap-2"
                  >
                    <IconEye className="size-4" />
                    <span>Lihat Detail</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEditPayment?.(row.original)}
                    className="gap-2"
                  >
                    <IconPencil className="size-4" />
                    <span>Edit Metode</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleStatus?.(row.original.id)}
                    className="gap-2"
                  >
                    <span>
                      {row.original.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={() =>
                      void handleDeleteSinglePayment(
                        row.original.id,
                        row.original.name
                      )
                    }
                    className="gap-2"
                  >
                    <IconTrash className="size-4" />
                    <span>{isDeleting ? "Menghapus..." : "Hapus"}</span>
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
      onViewDetails,
      onEditPayment,
      onToggleStatus,
      handleDeleteSinglePayment,
      deletingPaymentIds,
    ]
  );

  const table = useTable({
    features,
    data: filteredPayments,
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
      } else if (onDeletePayment) {
        await Promise.all(ids.map((id) => onDeletePayment(id)));
      }
      table.resetRowSelection();
      toast.add({
        title: `${ids.length} metode pembayaran berhasil dihapus`,
      });
    } finally {
      setIsDeletingSelected(false);
    }
  };

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
      a.download = `payments-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.add({
        title: `Berhasil mengekspor ${itemsToExport.length} metode pembayaran`,
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
            <PaymentFilterBar
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
                      method: "Metode",
                      type: "Tipe",
                      fee: "Biaya MDR",
                      volume: "Volume & Trx",
                      provider: "Akun/ID",
                      settlement: "Settlement",
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
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow
                    key={`skeleton-row-${idx}`}
                    className="hover:bg-transparent"
                  >
                    {table.getVisibleFlatColumns().map((column) => (
                      <TableCell
                        key={column.id}
                        className={
                          column.id === "select"
                            ? "w-10 px-2"
                            : column.id === "actions"
                              ? "w-12 px-2 text-right"
                              : ""
                        }
                      >
                        {column.id === "select" ? (
                          <div className="flex items-center justify-center">
                            <Skeleton className="size-4 rounded" />
                          </div>
                        ) : column.id === "method" ? (
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="size-8 rounded-lg shrink-0" />
                            <div className="flex flex-col gap-1 min-w-0">
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        ) : column.id === "actions" ? (
                          <Skeleton className="size-8 rounded-md ml-auto" />
                        ) : column.id === "status" ? (
                          <Skeleton className="h-5 w-16 rounded-full" />
                        ) : (
                          <Skeleton className="h-4 w-20" />
                        )}
                      </TableCell>
                    ))}
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
                      <IconCreditCard className="size-7 text-muted-foreground/50" />
                      <p className="text-sm font-medium">
                        Tidak ada metode pembayaran ditemukan
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
                <span className="sr-only">Halaman berikutnya</span>
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
