import * as React from "react";
import { AddonHeader } from "../components/AddonHeader";
import { AddonStatsCards } from "../components/AddonStatsCards";
import { AddonFilterBar } from "../components/AddonFilterBar";
import { AddonTable } from "../components/AddonTable";
import { INITIAL_ADDONS, type AddonItem } from "../data/addonData";

export default function AddonPage() {
  const [addons, setAddons] = React.useState<AddonItem[]>(INITIAL_ADDONS);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    React.useState<string>("Semua Kategori");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");

  const filteredAddons = React.useMemo(() => {
    return addons.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "Semua Kategori" ||
        item.category === selectedCategory;

      // Status filter
      let matchesStatus = true;
      if (selectedStatus === "active") {
        matchesStatus = item.isActive;
      } else if (selectedStatus === "inactive") {
        matchesStatus = !item.isActive;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [addons, searchQuery, selectedCategory, selectedStatus]);

  const handleToggleStatus = (addonId: string) => {
    setAddons((prev) =>
      prev.map((item) =>
        item.id === addonId ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  const handleDeleteAddon = (addonId: string) => {
    setAddons((prev) => prev.filter((item) => item.id !== addonId));
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("Semua Kategori");
    setSelectedStatus("all");
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AddonHeader />
      <AddonStatsCards addons={addons} />
      <AddonFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
      />
      <AddonTable
        addons={filteredAddons}
        onToggleStatus={handleToggleStatus}
        onDeleteAddon={handleDeleteAddon}
      />
    </div>
  );
}
