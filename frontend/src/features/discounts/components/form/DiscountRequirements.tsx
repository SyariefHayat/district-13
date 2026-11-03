import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { IconCoffee } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { DiscountFormData } from "../../schemas/discountFormSchema";

interface DiscountRequirementsProps {
  control: Control<DiscountFormData>;
  errors: FieldErrors<DiscountFormData>;
  minPurchase: number;
}

function formatRupiah(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return "";
  return val.toLocaleString("id-ID");
}

function parseRupiah(raw: string): number {
  const clean = raw.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

export function DiscountRequirements({
  control,
  errors,
  minPurchase,
}: DiscountRequirementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ketentuan & Syarat Belanja</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Warkop Friend Special Note Banner */}
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3.5 flex items-start gap-3 text-amber-300">
          <IconCoffee className="size-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="text-xs space-y-1">
            <span className="font-semibold block text-amber-200">
              Konsep Diskon Teman Warkop (Tanpa Min. Belanja)
            </span>
            <p className="text-zinc-300 leading-relaxed">
              Diskon dirancang fleksibel untuk teman atau kerabat yang mampir
              ngopi. Biarkan Minimal Belanja bernilai <strong>Rp 0</strong> agar
              kasir dapat langsung menerapkan diskon berapapun nominal
              pesanannya (bahkan hanya 1 cangkir kopi).
            </p>
          </div>
        </div>

        {/* Minimal Belanja */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs md:text-sm font-medium text-zinc-300">
              Minimal Belanja (Rp)
            </Label>
            {minPurchase === 0 ? (
              <span className="text-xs text-emerald-400 font-medium">
                Aktif tanpa syarat minimal (Rp 0)
              </span>
            ) : (
              <span className="text-xs text-zinc-400">
                Wajib belanja minimal Rp {minPurchase.toLocaleString("id-ID")}
              </span>
            )}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
              Rp
            </span>
            <Controller
              name="minPurchase"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 (Tanpa batas minimal)"
                  value={field.value ? formatRupiah(field.value) : ""}
                  onChange={(e) => field.onChange(parseRupiah(e.target.value))}
                  className="pl-10 font-mono text-sm"
                />
              )}
            />
          </div>

          {errors.minPurchase && (
            <p className="text-xs text-red-500">{errors.minPurchase.message}</p>
          )}
          <p className="text-xs text-zinc-500">
            Total harga pesanan kotor yang wajib dicapai sebelum diskon dapat
            digunakan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
