import { Button } from "@/components/ui/button";
import { IconDownload, IconPlus } from "@tabler/icons-react";

interface AddonHeaderProps {
  onAddAddon?: () => void;
  onExport?: () => void;
}

export function AddonHeader({ onAddAddon, onExport }: AddonHeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          Varian & Tambahan (Add-ons)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola opsi kustomisasi menu, varian susu, sirup, topping, dan saus
          tambahan.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onExport}
        >
          <IconDownload className="size-4" />
          <span>Ekspor</span>
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onAddAddon}
        >
          <IconPlus className="size-4" />
          <span>Tambah Varian</span>
        </Button>
      </div>
    </div>
  );
}
