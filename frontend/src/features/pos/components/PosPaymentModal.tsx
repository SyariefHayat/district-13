import { useState, useEffect, useMemo } from "react";
import {
  IconCash,
  IconQrcode,
  IconCheck,
  IconAlertCircle,
  IconReceipt2,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { formatIDR } from "@/features/product/data/productData";

interface PosPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  isSubmitting: boolean;
  onConfirmPayment: (
    paymentMethod: "CASH" | "QRIS",
    paidAmount: number
  ) => Promise<any>;
}

export function PosPaymentModal({
  open,
  onOpenChange,
  totalAmount,
  isSubmitting,
  onConfirmPayment,
}: PosPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick cash options
  const quickCashOptions = useMemo(() => {
    if (totalAmount <= 0) return [];
    const options = new Set<number>();
    options.add(totalAmount); // Exact amount

    const standardDenominations = [
      10000, 20000, 50000, 100000, 150000, 200000, 500000,
    ];
    standardDenominations.forEach((d) => {
      if (d > totalAmount) options.add(d);
    });

    // Next round up 10,000 and 50,000
    const next10k = Math.ceil(totalAmount / 10000) * 10000;
    if (next10k > totalAmount) options.add(next10k);

    const next50k = Math.ceil(totalAmount / 50000) * 50000;
    if (next50k > totalAmount) options.add(next50k);

    return Array.from(options)
      .sort((a, b) => a - b)
      .slice(0, 5);
  }, [totalAmount]);

  useEffect(() => {
    if (open) {
      setPaymentMethod("CASH");
      setCashReceivedInput(String(totalAmount));
      setErrorMessage(null);
    }
  }, [open, totalAmount]);

  const cashReceived = Number(cashReceivedInput.replace(/\D/g, "")) || 0;
  const changeAmount = cashReceived - totalAmount;
  const isCashSufficient = cashReceived >= totalAmount;

  const handleSubmit = async () => {
    setErrorMessage(null);
    try {
      if (paymentMethod === "CASH") {
        if (!isCashSufficient) {
          setErrorMessage(
            "Uang tunai yang diterima kurang dari total tagihan."
          );
          return;
        }
        await onConfirmPayment("CASH", cashReceived);
      } else {
        await onConfirmPayment("QRIS", totalAmount);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses transaksi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <IconReceipt2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Pembayaran Transaksi
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pilih metode pembayaran dan masukkan jumlah uang yang diterima.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Total Amount Card */}
        <div className="my-2 p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-muted-foreground">
            Total Tagihan Belanja
          </span>
          <span className="text-2xl font-black text-primary tracking-tight mt-0.5">
            {formatIDR(totalAmount)}
          </span>
        </div>

        {/* Payment Method Tabs */}
        <Tabs
          value={paymentMethod}
          onValueChange={(val) => {
            setPaymentMethod(val as "CASH" | "QRIS");
            setErrorMessage(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/60">
            <TabsTrigger
              value="CASH"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <IconCash className="size-4" />
              <span>Tunai (CASH)</span>
            </TabsTrigger>
            <TabsTrigger
              value="QRIS"
              className="gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <IconQrcode className="size-4" />
              <span>QRIS</span>
            </TabsTrigger>
          </TabsList>

          {/* CASH CONTENT */}
          <TabsContent value="CASH" className="flex flex-col gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Uang Diterima (Rp):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={
                    cashReceivedInput
                      ? Number(
                          cashReceivedInput.replace(/\D/g, "")
                        ).toLocaleString("id-ID")
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setCashReceivedInput(raw);
                  }}
                  className="pl-10 text-base font-bold text-foreground h-11"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {quickCashOptions.map((opt) => (
                <Button
                  key={opt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCashReceivedInput(String(opt))}
                  className={`text-xs h-8 px-2.5 ${
                    cashReceived === opt
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt === totalAmount ? "Uang Pas" : formatIDR(opt)}
                </Button>
              ))}
            </div>

            {/* Change Calculation Box */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                isCashSufficient
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <span className="font-medium">
                {isCashSufficient ? "Kembalian Kasir:" : "Uang Kurang:"}
              </span>
              <span className="text-base font-black">
                {formatIDR(Math.abs(changeAmount))}
              </span>
            </div>
          </TabsContent>

          {/* QRIS CONTENT */}
          <TabsContent
            value="QRIS"
            className="flex flex-col items-center gap-3 mt-3 py-2"
          >
            <div className="p-3 bg-white rounded-xl border shadow-xs flex flex-col items-center">
              {/* Dynamic QR Mock */}
              <div className="size-44 bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-center relative overflow-hidden">
                <IconQrcode className="size-36 text-white" />
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-[0.5px] flex items-center justify-center">
                  <div className="bg-background/90 text-primary px-2.5 py-1 rounded-md text-[10px] font-bold shadow-md border">
                    DISTRICT 13 QRIS
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-700 mt-2">
                NMID: ID10202613DISTRICT
              </span>
            </div>

            <div className="text-center text-xs text-muted-foreground max-w-xs">
              Minta pelanggan memindai kode QRIS di atas dengan aplikasi BCA,
              GoPay, OVO, atau mobile banking lainnya.
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <IconAlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={
              isSubmitting || (paymentMethod === "CASH" && !isCashSufficient)
            }
            className="gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <IconCheck className="size-4" />
                <span>Konfirmasi Bayar</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
