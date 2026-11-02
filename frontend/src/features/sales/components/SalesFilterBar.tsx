import * as React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  IconAdjustmentsHorizontal,
  IconCalendar,
  IconCheck,
  IconCircleDot,
  IconClock,
  IconDotsVertical,
  IconQrcode,
  IconReceipt,
  IconTrash,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PaymentMethod, TransactionStatus } from "../data/salesData";

export type SalesFilterAttributeId =
  | "transactionTime"
  | "transactionNumber"
  | "cashier"
  | "status"
  | "paymentMethod";

export interface SalesFilterItem {
  id: SalesFilterAttributeId;
  value: string;
  displayValue?: string;
}

interface AttributeDef {
  id: SalesFilterAttributeId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ATTRIBUTES: AttributeDef[] = [
  { id: "transactionTime", label: "Waktu Transaksi", icon: IconCalendar },
  { id: "transactionNumber", label: "No. Transaksi", icon: IconReceipt },
  { id: "cashier", label: "Kasir", icon: IconUser },
  { id: "status", label: "Status", icon: IconCircleDot },
  { id: "paymentMethod", label: "Metode Bayar", icon: IconQrcode },
];

export interface SalesFilterBarProps {
  filters: SalesFilterItem[];
  onFiltersChange: (filters: SalesFilterItem[]) => void;
}

export function SalesFilterBar({
  filters,
  onFiltersChange,
}: SalesFilterBarProps) {
  const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
  const [attributeSearch, setAttributeSearch] = React.useState("");
  const [activeOpenId, setActiveOpenId] =
    React.useState<SalesFilterAttributeId | null>(null);

  const filteredAttributes = ATTRIBUTES.filter((attr) =>
    attr.label.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  const handleAddAttribute = (id: SalesFilterAttributeId) => {
    if (!filters.some((f) => f.id === id)) {
      onFiltersChange([...filters, { id, value: "", displayValue: "" }]);
    }
    setActiveOpenId(id);
    setFilterMenuOpen(false);
    setAttributeSearch("");
  };

  const handleUpdateFilter = (
    id: SalesFilterAttributeId,
    value: string,
    displayValue?: string
  ) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value, displayValue: displayValue ?? value } : f
      )
    );
  };

  const handleRemoveFilter = (id: SalesFilterAttributeId) => {
    if (activeOpenId === id) {
      setActiveOpenId(null);
    }
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const handleClearFilterValue = (id: SalesFilterAttributeId) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value: "", displayValue: "" } : f
      )
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Active Filter Chips */}
      {filters.map((filter) => {
        const attr = ATTRIBUTES.find((a) => a.id === filter.id);
        if (!attr) return null;
        const Icon = attr.icon;

        return (
          <div
            key={filter.id}
            className="inline-flex items-center h-8 rounded-lg border border-border/80 bg-background/50 hover:bg-muted/30 transition-colors shadow-xs"
          >
            {/* Left: Attribute Label */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-foreground select-none">
              <Icon className="size-3.5 text-muted-foreground" />
              <span>{attr.label}</span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-border/80" />

            {/* Middle: Condition Trigger */}
            <ConditionPopover
              filter={filter}
              isOpen={activeOpenId === filter.id}
              onOpenChange={(open) => {
                if (open) {
                  setActiveOpenId(filter.id);
                } else if (activeOpenId === filter.id) {
                  setActiveOpenId(null);
                }
              }}
              onSelect={(val, displayVal) => {
                handleUpdateFilter(filter.id, val, displayVal);
                setActiveOpenId(null);
              }}
              onClear={() => handleClearFilterValue(filter.id)}
            />

            {/* Divider */}
            <div className="h-4 w-px bg-border/80" />

            {/* Right: Three dots dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center justify-center size-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-r-lg transition-colors cursor-pointer"
                  >
                    <IconDotsVertical className="size-3.5" />
                    <span className="sr-only">Options</span>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-40">
                {filter.value && (
                  <DropdownMenuItem
                    onClick={() => handleClearFilterValue(filter.id)}
                    className="gap-2"
                  >
                    <IconX className="size-3.5 text-muted-foreground" />
                    <span>Clear condition</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleRemoveFilter(filter.id)}
                  className="gap-2"
                >
                  <IconTrash className="size-3.5" />
                  <span>Remove filter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      {/* Filters Button with Dropdown */}
      <Popover open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <IconAdjustmentsHorizontal className="size-4" />
              <span>Filters</span>
            </Button>
          }
        />
        <PopoverContent align="start" className="w-56 p-1">
          <div className="p-1 pb-1.5 border-b border-border/50">
            <Input
              placeholder="Cari kolom filter..."
              value={attributeSearch}
              onChange={(e) => setAttributeSearch(e.target.value)}
              className="h-8 text-xs bg-transparent border-none shadow-none focus-visible:ring-0 px-2"
              autoFocus
            />
          </div>
          <div className="py-1">
            {filteredAttributes.map((attr) => {
              const Icon = attr.icon;
              return (
                <button
                  key={attr.id}
                  type="button"
                  onClick={() => handleAddAttribute(attr.id)}
                  className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span>{attr.label}</span>
                </button>
              );
            })}
            {filteredAttributes.length === 0 && (
              <div className="py-3 text-center text-xs text-muted-foreground">
                Tidak ada kolom ditemukan
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ConditionPopoverProps {
  filter: SalesFilterItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string, displayValue?: string) => void;
  onClear: () => void;
}

function ConditionPopover({
  filter,
  isOpen,
  onOpenChange,
  onSelect,
  onClear,
}: ConditionPopoverProps) {
  const isTextInput =
    filter.id === "transactionNumber" || filter.id === "cashier";
  const [searchInput, setSearchInput] = React.useState(filter.value);
  const [prevValue, setPrevValue] = React.useState(filter.value);

  if (isTextInput && filter.value !== prevValue) {
    setPrevValue(filter.value);
    setSearchInput(filter.value);
  }

  const selectedCalendarDate = React.useMemo(() => {
    if (filter.id === "transactionTime" && filter.value.startsWith("DATE:")) {
      const parts = filter.value.replace("DATE:", "").split("-");
      if (parts.length === 3) {
        return new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2])
        );
      }
    }
    return undefined;
  }, [filter.id, filter.value]);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 text-xs transition-colors cursor-pointer select-none max-w-44 truncate"
          >
            <span
              className={
                filter.value
                  ? "text-foreground font-medium truncate"
                  : "text-muted-foreground"
              }
            >
              {filter.displayValue || "Pilih kondisi"}
            </span>
          </button>
        }
      />
      <PopoverContent
        align="start"
        className={
          filter.id === "transactionTime"
            ? "w-auto p-1.5 shadow-lg border-border"
            : "w-56 p-2 space-y-2"
        }
      >
        {/* Filter by Transaction Time with shadcn Calendar */}
        {filter.id === "transactionTime" && (
          <div className="flex flex-col sm:flex-row items-stretch gap-1">
            {/* Quick Presets & Sessions Left Column */}
            <div className="flex w-full sm:w-44 shrink-0 flex-col gap-2 p-2">
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground px-1 mb-1">
                  Periode Cepat
                </div>
                <div className="space-y-0.5">
                  {[
                    { label: "Hari Ini", value: "TODAY" },
                    { label: "Kemarin", value: "YESTERDAY" },
                    { label: "7 Hari Terakhir", value: "LAST_7_DAYS" },
                    { label: "Bulan Ini", value: "THIS_MONTH" },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        onSelect(preset.value, preset.label);
                        onOpenChange(false);
                      }}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <IconCalendar className="size-3.5 text-muted-foreground" />
                        <span>{preset.label}</span>
                      </div>
                      {filter.value === preset.value && (
                        <IconCheck className="size-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-[11px] font-semibold text-muted-foreground px-1 mb-1">
                  Jam / Sesi Hari Ini
                </div>
                <div className="space-y-0.5">
                  {[
                    { label: "Pagi (06:00 - 12:00)", value: "SESSION_MORNING" },
                    {
                      label: "Siang (12:00 - 18:00)",
                      value: "SESSION_AFTERNOON",
                    },
                    { label: "Malam (18:00 - 24:00)", value: "SESSION_NIGHT" },
                  ].map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => {
                        onSelect(slot.value, slot.label);
                        onOpenChange(false);
                      }}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <IconClock className="size-3.5 text-muted-foreground" />
                        <span>{slot.label}</span>
                      </div>
                      {filter.value === slot.value && (
                        <IconCheck className="size-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {filter.value && (
                <>
                  <Separator />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onClear();
                      onOpenChange(false);
                    }}
                    className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground justify-start mt-auto"
                  >
                    <IconX className="size-3.5" />
                    <span>Hapus Filter</span>
                  </Button>
                </>
              )}
            </div>

            <Separator orientation="vertical" className="hidden sm:block" />

            {/* shadcn UI Calendar Component */}
            <div className="p-1 flex flex-col items-center">
              <div className="text-[11px] font-semibold text-muted-foreground self-start px-2 mb-1">
                Pilih Tanggal Kalender
              </div>
              <Calendar
                mode="single"
                selected={selectedCalendarDate}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const formattedValue = `DATE:${format(selectedDate, "yyyy-MM-dd")}`;
                    const displayLabel = format(selectedDate, "d MMMM yyyy", {
                      locale: idLocale,
                    });
                    onSelect(formattedValue, displayLabel);
                    onOpenChange(false);
                  }
                }}
                locale={idLocale}
                className="rounded-md border border-border/50 shadow-xs"
              />
            </div>
          </div>
        )}

        {isTextInput && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchInput.trim()) {
                onSelect(searchInput.trim(), `"${searchInput.trim()}"`);
              } else {
                onClear();
              }
              onOpenChange(false);
            }}
            className="space-y-2"
          >
            <div className="text-xs font-semibold text-muted-foreground px-1">
              {filter.id === "transactionNumber"
                ? "Kondisi No. Transaksi"
                : "Kondisi Nama Kasir"}
            </div>
            <div className="relative">
              <Input
                placeholder={
                  filter.id === "transactionNumber"
                    ? "Contoh: TRX-..."
                    : "Ketik nama kasir..."
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-8 text-xs pr-7"
                autoFocus
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear();
                  setSearchInput("");
                  onOpenChange(false);
                }}
                className="h-7 text-xs px-2 gap-1"
              >
                <IconX className="size-3.5" />
                <span>Clear</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs px-2.5 gap-1"
              >
                <IconCheck className="size-3.5" />
                <span>Apply</span>
              </Button>
            </div>
          </form>
        )}

        {filter.id === "status" && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Pilih Status
            </div>
            {[
              {
                label: "Selesai (COMPLETED)",
                value: "COMPLETED" as TransactionStatus,
              },
              {
                label: "Dibatalkan (VOIDED)",
                value: "VOIDED" as TransactionStatus,
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value, option.label);
                  onOpenChange(false);
                }}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
              >
                <span>{option.label}</span>
                {filter.value === option.value && (
                  <IconCheck className="size-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {filter.id === "paymentMethod" && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Pilih Metode Pembayaran
            </div>
            {[
              { label: "QRIS", value: "QRIS" as PaymentMethod },
              { label: "Tunai (CASH)", value: "CASH" as PaymentMethod },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value, option.label);
                  onOpenChange(false);
                }}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
              >
                <span>{option.label}</span>
                {filter.value === option.value && (
                  <IconCheck className="size-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
