import { Button } from "@/components/ui/button";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypeCsv,
  IconRefresh,
} from "@tabler/icons-react";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CashReportHeaderProps {
  title?: string;
  description?: string;
  onExport?: (format: "xlsx" | "csv") => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isExporting?: boolean;
}

export function CashReportHeader({
  title = "Kas Masuk & Keluar",
  description = "Pantau mutasi kas masuk, pengeluaran operasional, dan arus kas harian.",
  onExport,
  onRefresh,
  isRefreshing = false,
  isExporting = false,
}: CashReportHeaderProps) {
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="default"
                disabled={isExporting}
                className="gap-1.5 shadow-xs"
              >
                {isExporting ? (
                  <Spinner className="size-4" />
                ) : (
                  <IconDownload data-icon="inline-start" className="size-4" />
                )}
                <span>{isExporting ? "Mengekspor..." : "Ekspor"}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onExport?.("xlsx")}
              className="gap-2 cursor-pointer"
            >
              <IconFileSpreadsheet className="size-4 text-emerald-600" />
              <span>Ekspor Excel (.xlsx)</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onExport?.("csv")}
              className="gap-2 cursor-pointer"
            >
              <IconFileTypeCsv className="size-4 text-blue-600" />
              <span>Ekspor CSV (.csv)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
