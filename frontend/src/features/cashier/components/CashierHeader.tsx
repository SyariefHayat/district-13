import { useNavigate } from "react-router";
import {
  IconArrowDownLeft,
  IconDoorEnter,
  IconDoorExit,
  IconRefresh,
  IconReceipt2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatElapsed, formatTimeOnly } from "../data/cashierData";
import type { CashierShift } from "../data/cashierData";

interface CashierHeaderProps {
  cashierName: string;
  currentShift: CashierShift | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenShiftClick: () => void;
  onCloseShiftClick: () => void;
  onCashMovementClick: () => void;
}

export function CashierHeader({
  cashierName,
  currentShift,
  isRefreshing,
  onRefresh,
  onOpenShiftClick,
  onCloseShiftClick,
  onCashMovementClick,
}: CashierHeaderProps) {
  const navigate = useNavigate();
  const isShiftOpen = Boolean(currentShift && !currentShift.closedAt);

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Title & User Info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard Kasir
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/20"
            >
              Kasir Aktif: {cashierName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Workstation operasional kasir, ringkasan shift harian, dan mutasi
            kas laci.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 gap-1.5"
          >
            {isRefreshing ? (
              <Spinner className="size-4" />
            ) : (
              <IconRefresh className="size-4" />
            )}
            <span className="hidden sm:inline">Segarkan</span>
          </Button>

          {!isShiftOpen ? (
            <Button
              onClick={onOpenShiftClick}
              size="sm"
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <IconDoorEnter className="size-4" />
              <span>Buka Shift</span>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => navigate("/dashboard/pos")}
                className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
              >
                <IconReceipt2 className="size-4" />
                <span>Buka Terminal POS</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onCashMovementClick}
                className="h-9 gap-1.5"
              >
                <IconArrowDownLeft className="size-4 text-primary" />
                <span>Kas Masuk/Keluar</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={onCloseShiftClick}
                className="h-9 gap-1.5"
              >
                <IconDoorExit className="size-4" />
                <span>Tutup Shift</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Shift Status Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border p-3 text-xs ${
          isShiftOpen
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
            : "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex size-2.5 rounded-full ${
              isShiftOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {isShiftOpen
                ? "Shift Sedang Berjalan"
                : "Belum Ada Shift Terbuka"}
            </span>
            {isShiftOpen && currentShift && (
              <span className="text-muted-foreground font-normal">
                • Buka jam {formatTimeOnly(currentShift.openedAt)} (Durasi:{" "}
                {formatElapsed(currentShift.openedAt)})
              </span>
            )}
          </div>
        </div>

        {isShiftOpen ? (
          <Button
            size="sm"
            variant="link"
            onClick={() => navigate("/dashboard/pos")}
            className="h-auto p-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
          >
            Menuju Terminal POS Kasir &rarr;
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Buka shift untuk mulai mencatat modal kas & transaksi penjualan.
            </span>
            <Button
              size="sm"
              variant="link"
              onClick={onOpenShiftClick}
              className="h-auto p-0 text-xs font-semibold text-amber-600 dark:text-amber-400"
            >
              Buka Sekarang &rarr;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
