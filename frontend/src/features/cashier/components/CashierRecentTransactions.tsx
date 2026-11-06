import * as React from "react";
import { Link } from "react-router";
import {
  IconArrowRight,
  IconEye,
  IconReceipt2,
  IconSearch,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIDR, formatTimeOnly } from "../data/cashierData";
import type { CashierTransaction } from "../data/cashierData";

interface CashierRecentTransactionsProps {
  transactions: CashierTransaction[];
  isLoading: boolean;
  onViewDetail: (tx: CashierTransaction) => void;
}

export function CashierRecentTransactions({
  transactions,
  isLoading,
  onViewDetail,
}: CashierRecentTransactionsProps) {
  const [search, setSearch] = React.useState("");
  const [filterMethod, setFilterMethod] = React.useState<string>("ALL");

  const filtered = React.useMemo(() => {
    return transactions.filter((tx) => {
      if (
        search &&
        !tx.transactionNumber.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (filterMethod !== "ALL" && tx.paymentMethod !== filterMethod) {
        return false;
      }
      return true;
    });
  }, [transactions, search, filterMethod]);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <IconReceipt2 className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Transaksi Terakhir Kasir
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Daftar transaksi yang diproses selama shift berjalan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/dashboard/transactions" />}
            className="h-8 gap-1 text-xs text-primary font-medium"
          >
            <span>Semua Transaksi</span>
            <IconArrowRight className="size-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari no. transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "CASH", "QRIS", "TRANSFER"].map((m) => (
              <Button
                key={m}
                type="button"
                variant={filterMethod === m ? "default" : "outline"}
                size="sm"
                className="h-7 text-[11px] px-2.5 font-medium"
                onClick={() => setFilterMethod(m)}
              >
                {m === "ALL" ? "Semua" : m === "CASH" ? "Tunai" : m}
              </Button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="w-[140px]">No. Transaksi</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Metode Bayar</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center w-[100px]">Status</TableHead>
                <TableHead className="text-right w-[80px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-28 text-center text-xs text-muted-foreground"
                  >
                    {isLoading
                      ? "Memuat transaksi..."
                      : search
                        ? "Tidak ada transaksi yang cocok dengan pencarian"
                        : "Belum ada transaksi pada shift ini"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, 10).map((tx) => (
                  <TableRow key={tx.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">
                      {tx.transactionNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimeOnly(tx.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium px-2 py-0"
                      >
                        {tx.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatIDR(tx.totalAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          tx.status === "COMPLETED" ? "outline" : "destructive"
                        }
                        className={`text-[10px] px-2 py-0 ${
                          tx.status === "COMPLETED"
                            ? "border-emerald-500/40 text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300"
                            : ""
                        }`}
                      >
                        {tx.status === "COMPLETED" ? "Selesai" : "Void"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onViewDetail(tx)}
                        title="Lihat Detail Transaksi"
                      >
                        <IconEye className="size-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
