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
  const { summary, logs, isLoading, error, refetch } = useAuditLogData();

  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleViewDetails = (item: AuditLogItem) => {
    setSelectedLog(item);
    setDialogOpen(true);
  };

  const handleExport = (itemsToExport?: AuditLogItem[]) => {
    const list =
      itemsToExport && itemsToExport.length > 0 ? itemsToExport : logs;

    if (!list.length) {
      toast.add({
        title: "Tidak ada catatan audit log untuk diekspor",
      });
      return;
    }

    const exportRows = list.map((item) => ({
      ID: item.id,
      Waktu: item.createdAt,
      "Pengguna / Aktor": item.userName,
      Jabatan: item.userRole || "-",
      Aksi: item.action,
      "Tipe Entitas": item.entityType,
      "ID Entitas": item.entityId || "-",
      Keterangan: item.description,
      "IP Address": item.ipAddress || "-",
      Metadata: item.metadata ? JSON.stringify(item.metadata) : "-",
    }));

    const json = JSON.stringify(exportRows, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${list.length} catatan audit log`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AuditLogHeader onExport={() => handleExport()} />

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
        onExport={handleExport}
      />

      <AuditLogDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        log={selectedLog}
      />
    </div>
  );
}
