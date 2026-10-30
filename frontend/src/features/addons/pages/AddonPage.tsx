import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AddonHeader } from "../components/AddonHeader";
import { AddonStatsCards } from "../components/AddonStatsCards";
import { AddonTable } from "../components/AddonTable";
import { AddonFormDialog } from "../components/AddonFormDialog";
import { useAddonData } from "../hooks/useAddonData";
import type { AddonItem } from "../data/addonData";

export default function AddonPage() {
  const {
    addons,
    isLoading,
    error,
    refetch,
    toggleStatus,
    deleteAddon,
    deleteMultiple,
    createAddon,
    updateAddon,
  } = useAddonData();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAddon, setEditingAddon] = React.useState<AddonItem | null>(
    null
  );

  const handleOpenAdd = () => {
    setEditingAddon(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (addon: AddonItem) => {
    setEditingAddon(addon);
    setDialogOpen(true);
  };

  const handleExport = (selectedAddons?: AddonItem[]) => {
    const listToExport =
      selectedAddons && selectedAddons.length > 0 ? selectedAddons : addons;
    if (!listToExport.length) {
      toast.add({ title: "Tidak ada add-on untuk diekspor" });
      return;
    }
    const json = JSON.stringify(listToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `addons-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} add-on`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AddonHeader onExport={() => handleExport()} onAddAddon={handleOpenAdd} />

      {error && (
        <div className="mx-4 md:mx-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="size-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-1.5"
          >
            <IconRefresh className="size-4" />
            <span>Coba lagi</span>
          </Button>
        </div>
      )}

      <AddonStatsCards addons={addons} isLoading={isLoading} />
      <AddonTable
        addons={addons}
        isLoading={isLoading}
        onToggleStatus={toggleStatus}
        onDeleteAddon={deleteAddon}
        onDeleteMultiple={deleteMultiple}
        onEditAddon={handleOpenEdit}
        onExport={handleExport}
      />

      <AddonFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        addon={editingAddon}
        onSubmit={async (values) => {
          if (editingAddon) {
            return await updateAddon(editingAddon.id, values);
          } else {
            return await createAddon(values);
          }
        }}
      />
    </div>
  );
}
