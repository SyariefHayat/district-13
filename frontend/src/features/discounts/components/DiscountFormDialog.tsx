import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  type CreateDiscountInput,
  type DiscountApplyMode,
  type DiscountItem,
  type DiscountType,
} from "../data/discountData";

interface DiscountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: DiscountItem | null;
  onSubmit: (values: CreateDiscountInput) => Promise<boolean>;
}

function parseNumber(raw: string): number {
  const clean = raw.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

function formatRupiahInput(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return "";
  return value.toLocaleString("id-ID");
}

export function DiscountFormDialog({
  open,
  onOpenChange,
  discount,
  onSubmit,
}: DiscountFormDialogProps) {
  const isEditing = Boolean(discount);

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [applyMode, setApplyMode] = React.useState<DiscountApplyMode>("manual");
  const [type, setType] = React.useState<DiscountType>("percentage");
  const [valueStr, setValueStr] = React.useState("");
  const [maxDiscountStr, setMaxDiscountStr] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (discount) {
      setName(discount.name);
      setCode(discount.code);
      setApplyMode(discount.applyMode || "manual");
      setType(discount.type);
      setValueStr(
        discount.type === "percentage"
          ? String(discount.value)
          : formatRupiahInput(discount.value)
      );
      setMaxDiscountStr(
        discount.maxDiscount ? formatRupiahInput(discount.maxDiscount) : ""
      );
      setStartDate(discount.startDate ? discount.startDate.slice(0, 10) : "");
      setEndDate(discount.endDate ? discount.endDate.slice(0, 10) : "");
      setDescription(discount.description || "");
      setIsActive(discount.isActive);
    } else {
      setName("");
      setCode("");
      setApplyMode("manual");
      setType("percentage");
      setValueStr("20");
      setMaxDiscountStr("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [discount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setErrorMsg("Nama diskon wajib diisi");
      return;
    }

    const val =
      type === "percentage" ? parseFloat(valueStr) || 0 : parseNumber(valueStr);

    if (val <= 0) {
      setErrorMsg("Besar diskon harus lebih dari 0");
      return;
    }

    if (type === "percentage" && val > 100) {
      setErrorMsg("Diskon persentase tidak boleh melebihi 100%");
      return;
    }

    const generatedCode =
      code.trim().toUpperCase() ||
      `${applyMode === "automatic" ? "AUTO" : "TEMAN"}-${Date.now().toString().slice(-4)}`;

    const maxDiscount =
      type === "percentage" && maxDiscountStr
        ? parseNumber(maxDiscountStr)
        : null;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: CreateDiscountInput = {
        name: name.trim(),
        code: generatedCode,
        applyMode,
        type,
        value: val,
        minPurchase: 0,
        maxDiscount,
        startDate: startDate || null,
        endDate: endDate || null,
        description: description.trim() || null,
        isActive,
      };

      const ok = await onSubmit(payload);
      if (ok) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Ubah Pengaturan Diskon"
              : "Tambah Diskon Teman Warkop"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui aturan potongan diskon teman warkop, nilai potongan, atau periode aktif."
              : "Buat potongan diskon untuk teman atau kerabat yang datang ke warkop tanpa syarat minimum belanja."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mode Penerapan Diskon */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Metode Penerapan di Kasir *</Label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  type="button"
                  variant={applyMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setApplyMode("manual")}
                  className="w-full text-xs h-9 flex flex-col items-center justify-center py-2"
                >
                  <span className="font-semibold">Manual Kasir</span>
                  <span className="text-[10px] opacity-80">
                    Tombol pilihan saat teman datang
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={applyMode === "automatic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setApplyMode("automatic")}
                  className="w-full text-xs h-9 flex flex-col items-center justify-center py-2"
                >
                  <span className="font-semibold">Otomatis (Sistem)</span>
                  <span className="text-[10px] opacity-80">
                    Auto-apply di setiap checkout
                  </span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="disc-name">Nama Diskon *</Label>
              <Input
                id="disc-name"
                placeholder={
                  applyMode === "automatic"
                    ? "Contoh: Diskon Teman Nongkrong 20%"
                    : "Contoh: Diskon Sahabat Ngopi Rp 5.000"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Nama ini akan muncul pada struk kasir dan rincian transaksi
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="disc-code">Kode Referensi / ID</Label>
              <Input
                id="disc-code"
                placeholder="Contoh: TEMAN-20 atau SOBAT-5K"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase tracking-wider text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Identitas unik aturan di sistem kasir
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Tipe Diskon *</Label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  type="button"
                  variant={type === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setType("percentage")}
                  className="w-full text-xs"
                >
                  Persentase (%)
                </Button>
                <Button
                  type="button"
                  variant={type === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setType("fixed")}
                  className="w-full text-xs"
                >
                  Nominal (Rp)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disc-value">
                {type === "percentage"
                  ? "Besar Diskon (%) *"
                  : "Besar Diskon (Rp) *"}
              </Label>
              <div className="relative">
                {type === "fixed" && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    Rp
                  </span>
                )}
                <Input
                  id="disc-value"
                  placeholder={type === "percentage" ? "10" : "10.000"}
                  value={valueStr}
                  onChange={(e) => {
                    if (type === "percentage") {
                      setValueStr(e.target.value.replace(/[^0-9.]/g, ""));
                    } else {
                      const num = parseNumber(e.target.value);
                      setValueStr(formatRupiahInput(num));
                    }
                  }}
                  className={type === "fixed" ? "pl-9 font-mono" : "font-mono"}
                  required
                />
                {type === "percentage" && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    %
                  </span>
                )}
              </div>
            </div>

            {type === "percentage" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="disc-max">
                  Maksimal Potongan (Rp) - Opsional
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="disc-max"
                    placeholder="Kosongkan jika tanpa batas potongan"
                    value={maxDiscountStr}
                    onChange={(e) => {
                      const num = parseNumber(e.target.value);
                      setMaxDiscountStr(formatRupiahInput(num));
                    }}
                    className="pl-9 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="disc-start">Tanggal Mulai Berlaku</Label>
              <Input
                id="disc-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disc-end">Tanggal Berakhir (Opsional)</Label>
              <Input
                id="disc-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="disc-desc">Keterangan Diskon</Label>
              <Input
                id="disc-desc"
                placeholder="Contoh: Diskon khusus teman yang datang nongkrong di warkop"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
              <input
                type="checkbox"
                id="disc-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label
                htmlFor="disc-active"
                className="cursor-pointer font-medium text-sm"
              >
                Aktifkan diskon ini di kasir POS sekarang
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Spinner className="size-4" />}
              <span>{isEditing ? "Simpan Perubahan" : "Simpan Diskon"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
