import * as React from "react";
import {
  IconAdjustmentsHorizontal,
  IconBox,
  IconCheck,
  IconCircleDot,
  IconCurrencyDollar,
  IconDotsVertical,
  IconSearch,
  IconStar,
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
import { PRODUCT_CATEGORIES } from "../data/productData";

export type FilterAttributeId =
  "search" | "status" | "category" | "price" | "stock" | "rating";

export interface FilterItem {
  id: FilterAttributeId;
  value: string;
  displayValue?: string;
}

interface AttributeDef {
  id: FilterAttributeId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ATTRIBUTES: AttributeDef[] = [
  { id: "search", label: "Search", icon: IconSearch },
  { id: "status", label: "Status", icon: IconCircleDot },
  { id: "category", label: "Category", icon: IconTag },
  { id: "price", label: "Price", icon: IconCurrencyDollar },
  { id: "stock", label: "Stock", icon: IconBox },
  { id: "rating", label: "Rating", icon: IconStar },
];

export interface ProductFilterBarProps {
  filters: FilterItem[];
  onFiltersChange: (filters: FilterItem[]) => void;
  categories?: string[];
}

export function ProductFilterBar({
  filters,
  onFiltersChange,
  categories = PRODUCT_CATEGORIES,
}: ProductFilterBarProps) {
  const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
  const [attributeSearch, setAttributeSearch] = React.useState("");
  const [activeOpenId, setActiveOpenId] =
    React.useState<FilterAttributeId | null>(null);

  const filteredAttributes = ATTRIBUTES.filter((attr) =>
    attr.label.toLowerCase().includes(attributeSearch.toLowerCase())
  );

  const handleAddAttribute = (id: FilterAttributeId) => {
    if (!filters.some((f) => f.id === id)) {
      onFiltersChange([...filters, { id, value: "", displayValue: "" }]);
    }
    setActiveOpenId(id);
    setFilterMenuOpen(false);
    setAttributeSearch("");
  };

  const handleUpdateFilter = (
    id: FilterAttributeId,
    value: string,
    displayValue?: string
  ) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value, displayValue: displayValue ?? value } : f
      )
    );
  };

  const handleRemoveFilter = (id: FilterAttributeId) => {
    if (activeOpenId === id) {
      setActiveOpenId(null);
    }
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const handleClearFilterValue = (id: FilterAttributeId) => {
    onFiltersChange(
      filters.map((f) =>
        f.id === id ? { ...f, value: "", displayValue: "" } : f
      )
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Active Filter Pills (appears only when user clicks an attribute) */}
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

      {/* Filters Button with Dropdown (matching Screenshot 2026-10-24 170045.png) */}
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
  filter: FilterItem;
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
              { label: "Active", value: "Active" },
              { label: "Out of stock", value: "Out of stock" },
              { label: "Inactive", value: "Inactive" },
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
            {categories
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
              ))}
          </div>
        )}

        {filter.id === "price" && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Price range
            </div>
            {[
              { label: "Under $25", value: "under-25" },
              { label: "$25 - $50", value: "25-50" },
              { label: "Over $50", value: "over-50" },
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

        {filter.id === "stock" && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Stock availability
            </div>
            {[
              { label: "In stock (> 0)", value: "in-stock" },
              { label: "Out of stock (= 0)", value: "out-of-stock" },
              { label: "Low stock (≤ 10)", value: "low-stock" },
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

        {filter.id === "rating" && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
              Minimum rating
            </div>
            {[
              { label: "★ 4.5 and up", value: "4.5" },
              { label: "★ 4.0 and up", value: "4.0" },
              { label: "★ 3.5 and up", value: "3.5" },
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
