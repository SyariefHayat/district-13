import * as React from "react";
import {
  IconAdjustmentsHorizontal,
  IconArrowsExchange,
  IconCalendar,
  IconCheck,
  IconDotsVertical,
  IconSearch,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export type CashFilterAttributeId =
  "search" | "type" | "datePreset" | "cashier";

export interface CashFilterItem {
  id: CashFilterAttributeId;
  value: string;
  displayValue?: string;
}

interface AttributeDef {
  id: CashFilterAttributeId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ATTRIBUTES: AttributeDef[] = [
  { id: "search", label: "Cari Keterangan", icon: IconSearch },
  { id: "type", label: "Tipe Kas", icon: IconArrowsExchange },
  { id: "datePreset", label: "Periode Waktu", icon: IconCalendar },
  { id: "cashier", label: "Petugas", icon: IconUser },
];

export interface CashReportFilterBarProps {
  filters: CashFilterItem[];
  onFiltersChange: (filters: CashFilterItem[]) => void;
  users?: Array<{ id: string; name: string }>;
}

export function CashReportFilterBar({
  filters,
  onFiltersChange,
  users = [],
}: CashReportFilterBarProps) {
  const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
  const [attributeSearch, setAttributeSearch] = React.useState("");
  const [activeOpenId, setActiveOpenId] =
    React.useState<CashFilterAttributeId | null>(null);

  const filteredAttributes = ATTRIBUTES.filter((attr) =>
    attr.label.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  const handleAddAttribute = (id: CashFilterAttributeId) => {
    if (!filters.some((f) => f.id === id)) {
      onFiltersChange([...filters, { id, value: "", displayValue: "" }]);
    }
    setActiveOpenId(id);
    setFilterMenuOpen(false);
    setAttributeSearch("");
  };

  const handleUpdateFilter = (
    id: CashFilterAttributeId,
    value: string,
    displayValue?: string
  ) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value, displayValue: displayValue ?? value } : f
      )
    );
  };

  const handleRemoveFilter = (id: CashFilterAttributeId) => {
    if (activeOpenId === id) {
      setActiveOpenId(null);
    }
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const handleClearFilterValue = (id: CashFilterAttributeId) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value: "", displayValue: "" } : f
      )
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Active Filter Pills */}
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
            <CashConditionPopover
              filter={filter}
              users={users}
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
                    <span className="sr-only">Opsi</span>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-36">
                {filter.value && (
                  <DropdownMenuItem
                    onClick={() => handleClearFilterValue(filter.id)}
                  >
                    Reset nilai
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleRemoveFilter(filter.id)}
                >
                  Hapus filter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      {/* Filter Add Trigger Button */}
      <Popover open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <IconAdjustmentsHorizontal className="size-4" />
              <span>Filter</span>
            </Button>
          }
        />
        <PopoverContent align="start" className="w-56 p-1">
          <div className="p-1 pb-1.5 border-b border-border/50">
            <Input
              placeholder="Cari filter..."
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
                Filter tidak ditemukan
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface CashConditionPopoverProps {
  filter: CashFilterItem;
  users: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string, displayValue?: string) => void;
  onClear: () => void;
}

function CashConditionPopover({
  filter,
  users,
  isOpen,
  onOpenChange,
  onSelect,
  onClear,
}: CashConditionPopoverProps) {
  const [searchInput, setSearchInput] = React.useState(
    filter.id === "search" ? filter.value : ""
  );

  const typeOptions = [
    { value: "IN", label: "Kas Masuk (IN)" },
    { value: "OUT", label: "Kas Keluar (OUT)" },
  ];

  const datePresetOptions = [
    { value: "today", label: "Hari ini" },
    { value: "yesterday", label: "Kemarin" },
    { value: "last7days", label: "7 Hari Terakhir" },
    { value: "last30days", label: "30 Hari Terakhir" },
    { value: "thisMonth", label: "Bulan Ini" },
  ];

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {filter.displayValue || filter.value ? (
              <span className="font-semibold text-foreground">
                {filter.displayValue || filter.value}
              </span>
            ) : (
              <span>Pilih kondisi</span>
            )}
            {filter.value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="hover:text-destructive p-0.5"
              >
                <IconX className="size-3" />
              </span>
            )}
          </button>
        }
      />
      <PopoverContent align="start" className="w-56 p-1">
        {filter.id === "search" && (
          <div className="p-1 space-y-2">
            <Input
              placeholder="Ketik keterangan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSelect(searchInput, searchInput ? `"${searchInput}"` : "");
                }
              }}
              className="h-8 text-xs"
              autoFocus
            />
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onClear}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  onSelect(searchInput, searchInput ? `"${searchInput}"` : "")
                }
              >
                Terapkan
              </Button>
            </div>
          </div>
        )}

        {filter.id === "type" && (
          <div className="py-1">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value, opt.label)}
                className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
              >
                <span>{opt.label}</span>
                {filter.value === opt.value && (
                  <IconCheck className="size-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {filter.id === "datePreset" && (
          <div className="py-1">
            {datePresetOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value, opt.label)}
                className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
              >
                <span>{opt.label}</span>
                {filter.value === opt.value && (
                  <IconCheck className="size-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {filter.id === "cashier" && (
          <div className="py-1 max-h-48 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-2 text-center text-xs text-muted-foreground">
                Tidak ada data petugas
              </div>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onSelect(u.id, u.name)}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <span>{u.name}</span>
                  {filter.value === u.id && (
                    <IconCheck className="size-3.5 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
