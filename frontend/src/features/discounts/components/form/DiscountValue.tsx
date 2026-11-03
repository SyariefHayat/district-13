import * as React from "react";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { IconCalculator } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { DiscountFormData } from "../../schemas/discountFormSchema";

interface DiscountValueProps {
  control: Control<DiscountFormData>;
  errors: FieldErrors<DiscountFormData>;
  setValue: UseFormSetValue<DiscountFormData>;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount?: number | null;
}

function formatRupiah(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return "";
  return val.toLocaleString("id-ID");
}

function parseRupiah(raw: string): number {
  const clean = raw.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

const PERCENT_PRESETS = [10, 15, 20, 25, 50];
const FIXED_PRESETS = [2000, 5000, 10000, 15000];

export function DiscountValue({
  control,
  errors,
  setValue,
  type,
  value,
  maxDiscount,
}: DiscountValueProps) {
  const [sampleBill, setSampleBill] = React.useState<number>(50000);

  // Simulation calculation
  const calculatedCut = React.useMemo(() => {
    if (value <= 0 || sampleBill <= 0) return 0;
    if (type === "percentage") {
      const raw = Math.round((sampleBill * value) / 100);
      if (maxDiscount && maxDiscount > 0) {
        return Math.min(raw, maxDiscount);
      }
      return raw;
    }
    return Math.min(sampleBill, value);
  }, [type, value, maxDiscount, sampleBill]);

  const finalPay = Math.max(0, sampleBill - calculatedCut);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nilai & Skema Potongan</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Tipe Diskon Selection */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Tipe Diskon <span className="text-red-400">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={type === "percentage" ? "default" : "outline"}
              onClick={() => {
                setValue("type", "percentage", { shouldValidate: true });
                if (value > 100) {
                  setValue("value", 20, { shouldValidate: true });
                }
              }}
              className="flex items-center justify-center gap-2 h-11"
            >
              <span className="font-semibold text-sm">Persentase (%)</span>
            </Button>

            <Button
              type="button"
              variant={type === "fixed" ? "default" : "outline"}
              onClick={() => {
                setValue("type", "fixed", { shouldValidate: true });
                setValue("maxDiscount", null);
                if (value <= 100) {
                  setValue("value", 5000, { shouldValidate: true });
                }
              }}
              className="flex items-center justify-center gap-2 h-11"
            >
              <span className="font-semibold text-sm">Nominal Tunai (Rp)</span>
            </Button>
          </div>
        </div>

        {/* Besar Diskon Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs md:text-sm font-medium text-zinc-300">
              Besar Potongan ({type === "percentage" ? "%" : "Rp"}){" "}
              <span className="text-red-400">*</span>
            </Label>
            {type === "percentage" && (
              <span className="text-xs text-zinc-400">Rentang 1% - 100%</span>
            )}
          </div>

          <div className="relative">
            {type === "fixed" && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                Rp
              </span>
            )}
            <Controller
              name="value"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={
                    type === "percentage" ? "Contoh: 20" : "Contoh: 5.000"
                  }
                  value={
                    type === "percentage"
                      ? field.value
                        ? String(field.value)
                        : ""
                      : formatRupiah(field.value)
                  }
                  onChange={(e) => {
                    if (type === "percentage") {
                      const clean = e.target.value.replace(/[^0-9.]/g, "");
                      const num = parseFloat(clean) || 0;
                      field.onChange(num);
                    } else {
                      field.onChange(parseRupiah(e.target.value));
                    }
                  }}
                  className={
                    type === "fixed"
                      ? "pl-10 font-mono text-base tracking-wide"
                      : "pr-9 font-mono text-base tracking-wide"
                  }
                />
              )}
            />
            {type === "percentage" && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                %
              </span>
            )}
          </div>

          {errors.value && (
            <p className="text-xs text-red-500">{errors.value.message}</p>
          )}

          {/* Quick Presets Pills */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-zinc-400">Pilihan Cepat Warkop:</span>
            {type === "percentage"
              ? PERCENT_PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={value === p ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      setValue("value", p, { shouldValidate: true })
                    }
                    className="h-6 px-2 text-xs font-mono"
                  >
                    {p}%
                  </Button>
                ))
              : FIXED_PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={value === p ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      setValue("value", p, { shouldValidate: true })
                    }
                    className="h-6 px-2 text-xs font-mono"
                  >
                    Rp {p.toLocaleString("id-ID")}
                  </Button>
                ))}
          </div>
        </div>

        {/* Maksimal Potongan (Khusus Persentase) */}
        {type === "percentage" && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <Label className="text-xs md:text-sm font-medium text-zinc-300">
                Maksimal Potongan (Rp) - Opsional
              </Label>
              <span className="text-[11px] text-zinc-500">
                Kosongkan jika tanpa batas maksimum
              </span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                Rp
              </span>
              <Controller
                name="maxDiscount"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 15.000"
                    value={formatRupiah(field.value)}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      field.onChange(clean ? parseInt(clean, 10) : null);
                    }}
                    className="pl-10 font-mono text-sm"
                  />
                )}
              />
            </div>
            {errors.maxDiscount && (
              <p className="text-xs text-red-500">
                {errors.maxDiscount.message}
              </p>
            )}
            <p className="text-xs text-zinc-500">
              Membatasi nominal tertinggi yang bisa dipotong jika pelanggan
              memesan dalam jumlah banyak.
            </p>
          </div>
        )}

        {/* Interactive Simulation Box */}
        <div className="rounded-xl border border-zinc-800 bg-[#141416] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCalculator className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-200">
                Simulasi Perhitungan Kasir Warkop
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-zinc-700"
            >
              Live Preview
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-400">Contoh Total Pesanan:</span>
            {[25000, 50000, 100000].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setSampleBill(sample)}
                className={`text-xs px-2 py-0.5 rounded transition ${
                  sampleBill === sample
                    ? "bg-zinc-700 text-white font-medium"
                    : "bg-zinc-850 text-zinc-400 hover:text-white"
                }`}
              >
                Rp {sample.toLocaleString("id-ID")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center">
            <div className="bg-[#1a1a1e] p-2.5 rounded-lg">
              <span className="text-[10px] text-zinc-400 block">
                Total Pesanan
              </span>
              <span className="text-xs md:text-sm font-semibold font-mono text-zinc-200">
                Rp {sampleBill.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-[#1a1a1e] p-2.5 rounded-lg border border-emerald-900/40">
              <span className="text-[10px] text-emerald-400 block">
                Potongan Diskon
              </span>
              <span className="text-xs md:text-sm font-semibold font-mono text-emerald-400">
                - Rp {calculatedCut.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-[#1a1a1e] p-2.5 rounded-lg">
              <span className="text-[10px] text-zinc-400 block">
                Total Akhir Bayar
              </span>
              <span className="text-xs md:text-sm font-bold font-mono text-white">
                Rp {finalPay.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
