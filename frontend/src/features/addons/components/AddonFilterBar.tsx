import * as React from "react";
import {
  IconAdjustmentsHorizontal,
  IconCheck,
  IconCircleDot,
  IconCurrencyDollar,
  IconDotsVertical,
  IconSearch,
  IconTag,
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

export type AddonFilterAttributeId = "search" | "status" | "category" | "price";

export interface AddonFilterItem {
  id: AddonFilterAttributeId;
  value: string;
  displayValue?: string;
}

interface AttributeDef {
  id: AddonFilterAttributeId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ATTRIBUTES: AttributeDef[] = [
  { id: "search", label: "Search", icon: IconSearch },
  { id: "status", label: "Status", icon: IconCircleDot },
  { id: "category", label: "Category", icon: IconTag },
  { id: "price", label: "Price", icon: IconCurrencyDollar },
];

export interface AddonFilterBarProps {
  filters: AddonFilterItem[];
  onFiltersChange: (filters: AddonFilterItem[]) => void;
  categories?: string[];
}

export function AddonFilterBar({
  filters,
  onFiltersChange,
  categories = [],
}: AddonFilterBarProps) {
  const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
  const [attributeSearch, setAttributeSearch] = React.useState("");
  const [activeOpenId, setActiveOpenId] =
    React.useState<AddonFilterAttributeId | null>(null);

  const filteredAttributes = ATTRIBUTES.filter((attr) =>
    attr.label.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  const handleAddAttribute = (id: AddonFilterAttributeId) => {
    if (!filters.some((f) => f.id === id)) {
      onFiltersChange([...filters, { id, value: "", displayValue: "" }]);
    }
    setActiveOpenId(id);
    setFilterMenuOpen(false);
    setAttributeSearch("");
  };

  const handleUpdateFilter = (
    id: AddonFilterAttributeId,
    value: string,
    displayValue?: string
  ) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value, displayValue: displayValue ?? value } : f
      )
    );
  };

  const handleRemoveFilter = (id: AddonFilterAttributeId) => {
    if (activeOpenId === id) {
      setActiveOpenId(null);
    }
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const handleClearFilterValue = (id: AddonFilterAttributeId) => {
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
            <ConditionPopover
              filter={filter}
              categories={categories}
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
              <DropdownMenuContent align="end" className="w-36">
                {filter.value && (
                  <DropdownMenuItem
                    onClick={() => handleClearFilterValue(filter.id)}
                  >
                    Clear condition
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleRemoveFilter(filter.id)}
                >
                  Remove filter
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
              placeholder="Search attributes..."
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
                No attributes found
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ConditionPopoverProps {
  filter: AddonFilterItem;
  categories: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string, displayValue?: string) => void;
  onClear: () => void;
}

function ConditionPopover({
  filter,
  categories,
  isOpen,
  onOpenChange,
  onSelect,
  onClear,
}: ConditionPopoverProps) {
  const [searchInput, setSearchInput] = React.useState(
    filter.id === "search" ? filter.value : ""
  );
  const [prevValue, setPrevValue] = React.useState(filter.value);

  if (filter.id === "search" && filter.value !== prevValue) {
    setPrevValue(filter.value);
    setSearchInput(filter.value);
  }

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
              {filter.displayValue || "Select condition"}
            </span>
          </button>
        }
      />
      <PopoverContent align="start" className="w-56 p-2 space-y-2">
        {filter.id === "search" && (
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
              Search condition
            </div>
            <div className="relative">
              <Input
                placeholder="Type keywords..."
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
                className="h-7 text-xs px-2"
              >
                Clear
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs px-2.5">
                Apply
              </Button>
            </div>
          </form>
        )}

        {filter.id === "status" && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Select status
            </div>
            {[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
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

        {filter.id === "category" && (
          <div className="space-y-1 max-h-56 overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Select category
            </div>
            {categories.filter((c) => c !== "Semua Kategori").length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                Belum ada kategori terdaftar
              </div>
            ) : (
              categories
                .filter((c) => c !== "Semua Kategori")
                .map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onSelect(cat, cat);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                  >
                    <span>{cat}</span>
                    {filter.value === cat && (
                      <IconCheck className="size-3.5 text-primary" />
                    )}
                  </button>
                ))
            )}
          </div>
        )}

        {filter.id === "price" && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Price range
            </div>
            {[
              { label: "< Rp 5.000", value: "under-5k" },
              { label: "Rp 5.000 - Rp 10.000", value: "5k-10k" },
              { label: "> Rp 10.000", value: "over-10k" },
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
