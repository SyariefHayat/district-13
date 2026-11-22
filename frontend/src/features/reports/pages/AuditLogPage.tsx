import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { AuditLogHeader } from "../components/AuditLogHeader";
import { AuditLogStatsCards } from "../components/AuditLogStatsCards";
import { AuditLogTable } from "../components/AuditLogTable";
import { AuditLogDetailDialog } from "../components/AuditLogDetailDialog";
import { useAuditLogData } from "../hooks/useAuditLogData";
import type { AuditLogItem } from "../data/auditLogData";

export default function AuditLogPage() {
  const { summary, logs, isLoading, isSyncing, error, refetch } =
    useAuditLogData();

  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleViewDetails = (item: AuditLogItem) => {
    setSelectedLog(item);
    setDialogOpen(true);
  };

  const handleExport = async (format: "xlsx" | "csv" = "xlsx") => {
    setIsExporting(true);
    try {
      const list = logs;
      if (!list.length) {
        toast.add({
          title: "Tidak ada catatan audit log untuk diekspor",
        });
        return;
      }

      const headers = [
        "ID",
        "Waktu",
        "Pengguna / Aktor",
        "Jabatan",
        "Aksi",
        "Tipe Entitas",
        "ID Entitas",
        "Keterangan",
        "IP Address",
        "Metadata",
      ];

      const rows = list.map((item) => [
        item.id,
        item.createdAt,
        item.userName,
        item.userRole || "-",
        item.action,
        item.entityType,
        item.entityId || "-",
        item.description,
        item.ipAddress || "-",
        item.metadata ? JSON.stringify(item.metadata) : "-",
      ]);

      const csvContent = [headers, ...rows]
        .map((r) =>
          r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")
        )
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.${format === "xlsx" ? "csv" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.add({
        title: `Berhasil mengekspor ${list.length} catatan audit log`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AuditLogHeader
        onExport={handleExport}
        onRefresh={() => void refetch()}
        isRefreshing={isSyncing}
        isExporting={isExporting}
      />

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

      <AuditLogStatsCards summary={summary} isLoading={isLoading} />

      <AuditLogTable
        logs={logs}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onExport={() => void handleExport("xlsx")}
      />

      <AuditLogDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        log={selectedLog}
      />
    </div>
  );
}
