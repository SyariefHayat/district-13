import { useState, useEffect, useMemo } from "react";
import {
  IconCash,
  IconQrcode,
  IconBuildingBank,
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
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "QRIS" | "TRANSFER"
  >("CASH");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [transferBank, setTransferBank] = useState<string>("BCA");
  const [transferRef, setTransferRef] = useState<string>("");
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
      setTransferBank("BCA");
      setTransferRef("");
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
        // QRIS and Bank Transfer (both non-cash, mapped to QRIS)
        await onConfirmPayment("QRIS", totalAmount);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses transaksi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <IconReceipt2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Pembayaran Kasir (Checkout)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Langkah 2: Pilih metode pembayaran &rarr; Langkah 3: Konfirmasi
                pembayaran.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Total Amount Card */}
        <div className="my-1 p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-muted-foreground">
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
            setPaymentMethod(val as "CASH" | "QRIS" | "TRANSFER");
            setErrorMessage(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/60">
            <TabsTrigger
              value="CASH"
              className="gap-1.5 text-xs font-bold min-h-[44px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <IconCash className="size-4" />
              <span>Tunai</span>
            </TabsTrigger>
            <TabsTrigger
              value="QRIS"
              className="gap-1.5 text-xs font-bold min-h-[44px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <IconQrcode className="size-4" />
              <span>QRIS</span>
            </TabsTrigger>
            <TabsTrigger
              value="TRANSFER"
              className="gap-1.5 text-xs font-bold min-h-[44px] data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <IconBuildingBank className="size-4" />
              <span>Transfer</span>
            </TabsTrigger>
          </TabsList>

          {/* CASH CONTENT */}
          <TabsContent value="CASH" className="flex flex-col gap-3 mt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">
                Uang Tunai Diterima:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
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
                  className="pl-11 text-lg font-black text-foreground h-12"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Pilihan Uang Pas & Pecahan Cepat:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickCashOptions.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant="outline"
                    onClick={() => setCashReceivedInput(String(opt))}
                    className={`text-xs min-h-[44px] px-3 font-bold ${
                      cashReceived === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {opt === totalAmount ? "Uang Pas" : formatIDR(opt)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Change Calculation Box */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                isCashSufficient
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <span className="font-semibold text-xs">
                {isCashSufficient ? "Kembalian Kasir:" : "Uang Kurang:"}
              </span>
              <span className="text-lg font-black">
                {formatIDR(Math.abs(changeAmount))}
              </span>
            </div>
          </TabsContent>

          {/* QRIS CONTENT */}
          <TabsContent
            value="QRIS"
            className="flex flex-col items-center gap-3 mt-3 py-1"
          >
            <div className="p-3 bg-white rounded-xl border shadow-xs flex flex-col items-center">
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
              GoPay, OVO, atau mobile banking lainnya senilai{" "}
              <strong>{formatIDR(totalAmount)}</strong>.
            </div>
          </TabsContent>

          {/* TRANSFER CONTENT */}
          <TabsContent
            value="TRANSFER"
            className="flex flex-col gap-3 mt-3 py-1"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Pilih Rekening Bank Tujuan:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["BCA", "Mandiri", "BRI"].map((bank) => (
                  <Button
                    key={bank}
                    type="button"
                    variant={transferBank === bank ? "default" : "outline"}
                    className="min-h-[44px] text-xs font-bold"
                    onClick={() => setTransferBank(bank)}
                  >
                    {bank}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-bold text-foreground">
                  Bank {transferBank}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Rekening:</span>
                <span className="font-mono font-bold text-primary">
                  {transferBank === "BCA"
                    ? "883-029-1928"
                    : transferBank === "Mandiri"
                      ? "137-00-1928374-1"
                      : "0206-01-029384-50-2"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atas Nama:</span>
                <span className="font-semibold text-foreground">
                  PT DISTRICT 13 INDONESIA
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground">
                Nomor Referensi Transfer (Opsional):
              </label>
              <Input
                type="text"
                placeholder="Misal: TRF-12345 atau nama pengirim"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                className="h-11 text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <IconAlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="min-h-[44px] px-4"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting || (paymentMethod === "CASH" && !isCashSufficient)
            }
            className="gap-2 font-bold min-h-[44px] px-6 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <IconCheck className="size-4" />
                <span>Langkah 3: Konfirmasi Bayar</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
