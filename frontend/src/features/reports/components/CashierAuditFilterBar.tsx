import * as React from "react";
import {
  IconAdjustmentsHorizontal,
  IconCheck,
  IconDotsVertical,
  IconPercentage,
  IconSearch,
  IconShieldCheck,
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

export type CashierAuditFilterAttributeId =
  "search" | "auditStatus" | "accuracy";

export interface CashierAuditFilterItem {
  id: CashierAuditFilterAttributeId;
  value: string;
  displayValue?: string;
}

interface AttributeDef {
  id: CashierAuditFilterAttributeId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ATTRIBUTES: AttributeDef[] = [
  { id: "search", label: "Cari Kasir", icon: IconSearch },
  { id: "auditStatus", label: "Status Audit", icon: IconShieldCheck },
  { id: "accuracy", label: "Akurasi", icon: IconPercentage },
];

export interface CashierAuditFilterBarProps {
  filters: CashierAuditFilterItem[];
  onFiltersChange: (filters: CashierAuditFilterItem[]) => void;
}

export function CashierAuditFilterBar({
  filters,
  onFiltersChange,
}: CashierAuditFilterBarProps) {
  const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
  const [attributeSearch, setAttributeSearch] = React.useState("");
  const [activeOpenId, setActiveOpenId] =
    React.useState<CashierAuditFilterAttributeId | null>(null);

  const filteredAttributes = ATTRIBUTES.filter((attr) =>
    attr.label.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  const handleAddAttribute = (id: CashierAuditFilterAttributeId) => {
    if (!filters.some((f) => f.id === id)) {
      onFiltersChange([...filters, { id, value: "", displayValue: "" }]);
    }
    setActiveOpenId(id);
    setFilterMenuOpen(false);
    setAttributeSearch("");
  };

  const handleRemoveFilter = (id: CashierAuditFilterAttributeId) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
    if (activeOpenId === id) setActiveOpenId(null);
  };

  const handleUpdateFilter = (
    id: CashierAuditFilterAttributeId,
    value: string,
    displayValue?: string
  ) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value, displayValue: displayValue || value } : f
      )
    );
  };

  const handleClearFilterValue = (id: CashierAuditFilterAttributeId) => {
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
            <CashierAuditConditionPopover
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

interface CashierAuditConditionPopoverProps {
  filter: CashierAuditFilterItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string, displayValue?: string) => void;
  onClear: () => void;
}

function CashierAuditConditionPopover({
  filter,
  isOpen,
  onOpenChange,
  onSelect,
  onClear,
}: CashierAuditConditionPopoverProps) {
  const [searchInput, setSearchInput] = React.useState(
    filter.id === "search" ? filter.value : ""
  );

  const statusOptions = [
    { value: "NORMAL", label: "Aman / Normal" },
    { value: "WARNING", label: "Perlu Review" },
    { value: "CRITICAL", label: "Selisih Tinggi (Kritis)" },
  ];

  const accuracyOptions = [
    { value: "high", label: "Sangat Tinggi (≥ 99.5%)" },
    { value: "medium", label: "Standar (98.0% - 99.4%)" },
    { value: "low", label: "Perlu Perhatian (< 98.0%)" },
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
      <PopoverContent align="start" className="w-64 p-1">
        {filter.id === "search" && (
          <div className="p-1 space-y-2">
            <Input
              placeholder="Nama atau kode kasir..."
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
            <div className="flex justify-end gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSearchInput("");
                  onClear();
                }}
              >
                Reset
              </Button>
              <Button
                size="xs"
                onClick={() => {
                  onSelect(searchInput, searchInput ? `"${searchInput}"` : "");
                }}
              >
                Terapkan
              </Button>
            </div>
          </div>
        )}

        {filter.id === "auditStatus" && (
          <div className="py-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pilih Status
            </div>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value, opt.label)}
                className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                  filter.value === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>{opt.label}</span>
                {filter.value === opt.value && (
                  <IconCheck className="size-3.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {filter.id === "accuracy" && (
          <div className="py-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pilih Rentang Akurasi
            </div>
            {accuracyOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value, opt.label)}
                className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                  filter.value === opt.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>{opt.label}</span>
                {filter.value === opt.value && (
                  <IconCheck className="size-3.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
