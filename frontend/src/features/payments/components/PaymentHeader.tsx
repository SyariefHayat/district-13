import { Button } from "@/components/ui/button";
import { IconDownload, IconPlus } from "@tabler/icons-react";

interface PaymentHeaderProps {
  title?: string;
  description?: string;
  onAddPayment?: () => void;
  onExport?: () => void;
}

export function PaymentHeader({
  title = "Metode Pembayaran",
  description = "Kelola metode pembayaran dan saluran kasir.",
  onAddPayment,
  onExport,
}: PaymentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-4 md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="default"
          onClick={onExport}
          className="gap-1.5 shadow-xs"
        >
          <IconDownload data-icon="inline-start" className="size-4" />
          <span>Export</span>
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={onAddPayment}
          className="gap-1.5 shadow-xs"
        >
          <IconPlus data-icon="inline-start" className="size-4" />
          <span>Tambah Metode</span>
        </Button>
      </div>
    </div>
  );
}
