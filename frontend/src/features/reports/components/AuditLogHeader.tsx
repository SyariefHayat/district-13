import { Button } from "@/components/ui/button";
import { IconDownload, IconRefresh } from "@tabler/icons-react";
import { Spinner } from "@/components/ui/spinner";

interface AuditLogHeaderProps {
  title?: string;
  description?: string;
  onExport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AuditLogHeader({
  title = "Audit Log",
  description = "Rekam jejak aktivitas sistem, perubahan data, dan keamanan operasional.",
  onExport,
  onRefresh,
  isRefreshing = false,
}: AuditLogHeaderProps) {
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
        {onRefresh && (
          <Button
            variant="outline"
            size="default"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 shadow-xs"
          >
            {isRefreshing ? (
              <Spinner className="size-4" />
            ) : (
              <IconRefresh className="size-4" />
            )}
            <span>Segarkan</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="default"
          onClick={onExport}
          className="gap-1.5 shadow-xs"
        >
          <IconDownload data-icon="inline-start" className="size-4" />
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
}
