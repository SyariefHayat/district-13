import * as React from "react";
import {
  IconArrowDownLeft,
  IconCash,
  IconCreditCard,
  IconQrcode,
  IconWallet,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatIDR } from "../data/cashierData";
import type { CashierTransaction } from "../data/cashierData";

interface CashierShiftReconciliationCardProps {
  openingCash: number;
  cashSales: number;
  nonCashSales: number;
  cashIn: number;
  cashOut: number;
  drawerCash: number;
  transactions: CashierTransaction[];
  isShiftOpen: boolean;
  onOpenCashMovement: () => void;
}

export function CashierShiftReconciliationCard({
  openingCash,
  cashSales,
  nonCashSales,
  cashIn,
  cashOut,
  drawerCash,
  transactions,
  isShiftOpen,
  onOpenCashMovement,
}: CashierShiftReconciliationCardProps) {
  // Compute breakdown by payment methods
  const paymentBreakdown = React.useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {};
    for (const tx of transactions) {
      if (tx.status !== "COMPLETED") continue;
      const method = tx.paymentMethod || "CASH";
      if (!summary[method]) {
        summary[method] = { count: 0, total: 0 };
      }
      summary[method].count += 1;
      summary[method].total += tx.totalAmount;
    }
    return summary;
  }, [transactions]);

  const totalRevenue = cashSales + nonCashSales;

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <IconWallet className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Rekonsiliasi Kas Laci (Drawer)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Rincian arus kas fisik laci kasir dan metode pembayaran shift
            </p>
          </div>
        </div>
        {isShiftOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCashMovement}
            className="h-8 gap-1 text-xs"
          >
            <IconArrowDownLeft className="size-3.5 text-primary" />
            <span>Catat Mutasi Kas</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cash Calculation Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 rounded-xl border bg-muted/20 p-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Modal Awal:</span>
            <span className="font-semibold text-foreground">
              {formatIDR(openingCash)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <span className="text-emerald-500 font-bold">+</span> Penjualan
              Tunai:
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatIDR(cashSales)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <span className="text-blue-500 font-bold">+</span> Kas Masuk:
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {formatIDR(cashIn)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <span className="text-rose-500 font-bold">-</span> Kas Keluar:
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {formatIDR(cashOut)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1 rounded-lg bg-background p-2 border border-primary/20">
            <span className="text-muted-foreground font-medium text-[11px]">
              Total Kas Fisik di Laci:
            </span>
            <span className="font-bold text-sm text-primary">
              {formatIDR(drawerCash)}
            </span>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Distribusi Metode Pembayaran
            </span>
            <span className="text-muted-foreground">
              Total Omzet: {formatIDR(totalRevenue)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* CASH */}
            <div className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                  <IconCash className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Tunai (Cash)</p>
                  <p className="text-[11px] text-muted-foreground">
                    {paymentBreakdown["CASH"]?.count || 0} struk
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatIDR(paymentBreakdown["CASH"]?.total || 0)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {totalRevenue > 0
                    ? Math.round(
                        ((paymentBreakdown["CASH"]?.total || 0) /
                          totalRevenue) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* QRIS */}
            <div className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
                  <IconQrcode className="size-4" />
                </div>
                <div>
                  <p className="font-medium">QRIS / Digital</p>
                  <p className="text-[11px] text-muted-foreground">
                    {paymentBreakdown["QRIS"]?.count || 0} struk
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatIDR(paymentBreakdown["QRIS"]?.total || 0)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {totalRevenue > 0
                    ? Math.round(
                        ((paymentBreakdown["QRIS"]?.total || 0) /
                          totalRevenue) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* Transfer / Other */}
            <div className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                  <IconCreditCard className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Transfer / Kartu</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(paymentBreakdown["TRANSFER"]?.count || 0) +
                      (paymentBreakdown["DEBIT"]?.count || 0) +
                      (paymentBreakdown["CREDIT"]?.count || 0)}{" "}
                    struk
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatIDR(
                    (paymentBreakdown["TRANSFER"]?.total || 0) +
                      (paymentBreakdown["DEBIT"]?.total || 0) +
                      (paymentBreakdown["CREDIT"]?.total || 0)
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {totalRevenue > 0
                    ? Math.round(
                        (((paymentBreakdown["TRANSFER"]?.total || 0) +
                          (paymentBreakdown["DEBIT"]?.total || 0) +
                          (paymentBreakdown["CREDIT"]?.total || 0)) /
                          totalRevenue) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
