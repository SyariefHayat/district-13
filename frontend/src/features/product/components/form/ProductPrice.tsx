import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AddProductFormData } from "../../schemas/productFormSchema";

interface ProductPriceProps {
  control: Control<AddProductFormData>;
  errors: FieldErrors<AddProductFormData>;
  price: number;
  costPrice?: number;
  chargeTax: boolean;
}

function formatRupiah(value?: number): string {
  if (value === undefined || value === null || value === 0) return "";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function parseRupiah(raw: string): number {
  const clean = raw.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

export function ProductPrice({
  control,
  errors,
  price,
  costPrice,
  chargeTax,
}: ProductPriceProps) {
  const marginAmount =
    costPrice !== undefined && costPrice > 0 ? price - costPrice : null;

  const marginPercentage =
    marginAmount !== null && price > 0
      ? ((marginAmount / price) * 100).toFixed(1)
      : null;

  const taxAmount = chargeTax ? Math.round(price * 0.11) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Harga</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Harga Jual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs md:text-sm font-medium text-zinc-300">
              Harga Jual <span className="text-red-400">*</span>
            </Label>
            {chargeTax && price > 0 && (
              <span className="text-xs text-amber-400">
                + PPN 11%: Rp {taxAmount.toLocaleString("id-ID")}
              </span>
            )}
          </div>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Rp"
                value={formatRupiah(field.value)}
                onChange={(e) => field.onChange(parseRupiah(e.target.value))}
              />
            )}
          />
          {errors.price && (
            <p className="text-xs text-red-500">{errors.price.message}</p>
          )}
          <p className="text-[11px] text-zinc-500">
            Harga final yang dibayar oleh pelanggan di kasir saat transaksi.
          </p>
        </div>

        {/* Harga HPP / Modal */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Harga HPP / Modal
          </Label>
          <Controller
            name="costPrice"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Rp"
                value={formatRupiah(field.value)}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "");
                  field.onChange(clean ? parseInt(clean, 10) : undefined);
                }}
              />
            )}
          />
          <p className="text-[11px] text-zinc-500">
            Harga Pokok Penjualan untuk menghitung estimasi keuntungan margin
            kotor.
          </p>
        </div>

        {/* Estimasi Margin Laba Kotor */}
        {marginAmount !== null && (
          <div
            className={`rounded-lg border p-3 text-xs space-y-1 ${
              marginAmount >= 0
                ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-400"
                : "border-red-900/50 bg-red-950/20 text-red-400"
            }`}
          >
            <div className="flex items-center justify-between font-medium">
              <span>Estimasi Margin Laba:</span>
              <span>
                {marginAmount >= 0 ? "+" : ""}
                Rp {marginAmount.toLocaleString("id-ID")} ({marginPercentage}%)
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              {marginAmount >= 0
                ? "Margin laba positif dari selisih Harga Jual dengan HPP."
                : "Perhatian: Harga Jual di bawah HPP (berpotensi rugi)."}
            </p>
          </div>
        )}

        {/* Charge tax on this product */}
        <div className="space-y-2 pt-2 border-t border-zinc-850">
          <Controller
            name="chargeTax"
            control={control}
            render={({ field }) => (
              <Label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-zinc-700 data-checked:bg-white data-checked:text-black data-checked:border-white"
                />
                <span className="text-xs md:text-sm text-zinc-300 font-normal">
                  Kenakan pajak (PPN 11%) pada produk ini
                </span>
              </Label>
            )}
          />

          {chargeTax && price > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-[#161619] p-3 text-xs text-zinc-300 space-y-1.5 ml-6">
              <div className="flex justify-between">
                <span className="text-zinc-400">Harga Jual Pokok:</span>
                <span>Rp {price.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>PPN 11%:</span>
                <span>+ Rp {taxAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-800 font-semibold text-white">
                <span>Total Tagihan Pelanggan:</span>
                <span>Rp {(price + taxAmount).toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
