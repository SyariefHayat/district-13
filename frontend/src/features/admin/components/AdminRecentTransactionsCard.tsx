import { Link } from "react-router";
import { IconEye, IconReceipt, IconReceiptOff } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatIDR,
  formatTimeOnly,
  type AdminTransaction,
} from "../data/adminData";

interface AdminRecentTransactionsCardProps {
  transactions: AdminTransaction[];
  isLoading: boolean;
  onViewDetail: (tx: AdminTransaction) => void;
  onVoidClick: (tx: AdminTransaction) => void;
}

export function AdminRecentTransactionsCard({
  transactions,
  isLoading,
  onViewDetail,
  onVoidClick,
}: AdminRecentTransactionsCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconReceipt className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Transaksi Terkini Toko
            </CardTitle>
            <CardDescription className="text-xs">
              Pantau struk penjualan kasir dan pembatalan transaksi (VOID)
            </CardDescription>
          </div>
        </div>
        <Link
          to="/dashboard/transactions"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-8 text-xs",
          })}
        >
          Semua Transaksi
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconReceipt className="size-5" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              Belum Ada Transaksi
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Transaksi baru yang diproses oleh kasir akan otomatis tampil di
              sini.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {transactions.slice(0, 7).map((tx) => {
              const isVoided = tx.status === "VOIDED";

              return (
                <div
                  key={tx.id}
                  className="flex flex-col gap-2 p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-foreground">
                        {tx.transactionNumber}
                      </span>
                      <Badge
                        variant={isVoided ? "destructive" : "outline"}
                        className={`text-[10px] px-1.5 py-0 ${
                          !isVoided
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : ""
                        }`}
                      >
                        {isVoided ? "VOID" : "SELESAI"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {tx.paymentMethod}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{formatTimeOnly(tx.createdAt)}</span>
                      <span>•</span>
                      <span>Kasir: {tx.cashierName}</span>
                      <span>•</span>
                      <span>{tx.itemCount} item</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={`text-sm font-bold ${
                        isVoided
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {formatIDR(tx.totalAmount)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(tx)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Lihat Detail Transaksi"
                      >
                        <IconEye className="size-4" />
                      </Button>

                      {!isVoided && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onVoidClick(tx)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Batalkan Transaksi (VOID)"
                        >
                          <IconReceiptOff className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
