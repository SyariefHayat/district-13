import {
  IconHistory,
  IconCopy,
  IconCheck,
  IconClock,
  IconUser,
  IconCategory,
  IconId,
  IconWorld,
} from "@tabler/icons-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { type AuditLogItem } from "../data/auditLogData";

interface AuditLogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLogItem | null;
}

export function AuditLogDetailDialog({
  open,
  onOpenChange,
  log,
}: AuditLogDetailDialogProps) {
  const [copied, setCopied] = React.useState(false);

  if (!log) return null;

  const handleCopyJson = () => {
    void navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    toast.add({
      title: "Data audit log disalin ke clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadgeClass = (action: string) => {
    if (
      action.includes("VOID") ||
      action.includes("FAILED") ||
      action.includes("DELETED")
    ) {
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300";
    }
    if (
      action.includes("CREATED") ||
      action.includes("SUCCEEDED") ||
      action.includes("OPENED")
    ) {
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    }
    if (
      action.includes("UPDATED") ||
      action.includes("CHANGED") ||
      action.includes("CLOSED")
    ) {
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
    }
    return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <IconHistory className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Rincian Audit Log
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  ID: {log.id}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 font-mono ${getActionBadgeClass(log.action)}`}
            >
              {log.action}
            </Badge>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <IconUser className="size-3.5" />
                <span className="font-medium">Pengguna / Aktor</span>
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {log.userName}
              </p>
              {log.userRole && (
                <p className="text-[11px] text-muted-foreground">
                  {log.userRole}
                </p>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <IconClock className="size-3.5" />
                <span className="font-medium">Waktu Tercatat</span>
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {log.createdAt}
              </p>
              {log.ipAddress && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <IconWorld className="size-3" />
                  <span>{log.ipAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Entity Information */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500 flex items-center gap-1.5">
                <IconCategory className="size-3.5" />
                <span>Tipe Entitas</span>
              </span>
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 font-mono"
              >
                {log.entityType}
              </Badge>
            </div>
            {log.entityId && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <IconId className="size-3.5" />
                  <span>ID Entitas</span>
                </span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {log.entityId}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1.5">
              Deskripsi Aktivitas
            </h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {log.description}
            </div>
          </div>

          {/* Payload Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Metadata / Payload
                </h4>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleCopyJson}
                  className="gap-1 text-[11px] h-6 px-1.5"
                >
                  {copied ? (
                    <IconCheck className="size-3 text-emerald-600" />
                  ) : (
                    <IconCopy className="size-3" />
                  )}
                  <span>{copied ? "Tersalin" : "Salin JSON"}</span>
                </Button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-50 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="bg-slate-50 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyJson}
            className="gap-1.5"
          >
            {copied ? (
              <IconCheck className="size-4 text-emerald-600" />
            ) : (
              <IconCopy className="size-4" />
            )}
            <span>Salin Log</span>
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
