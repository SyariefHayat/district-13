import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AddProductFormData } from "../../schemas/productFormSchema";

interface ProductStockProps {
  control: Control<AddProductFormData>;
  errors: FieldErrors<AddProductFormData>;
  warehouseStock: number;
  displayStock: number;
}

export function ProductStock({
  control,
  errors,
  warehouseStock,
  displayStock,
}: ProductStockProps) {
  const totalStock = (warehouseStock || 0) + (displayStock || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stok</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stok Gudang */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Stok Gudang
          </Label>
          <Controller
            name="warehouseStock"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min="0"
                placeholder="Contoh: 50"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
              />
            )}
          />
          {errors.warehouseStock && (
            <p className="text-xs text-red-500">
              {errors.warehouseStock.message}
            </p>
          )}
          <p className="text-[11px] text-zinc-500">
            Jumlah unit stok cadangan yang disimpan di gudang penyimpanan.
          </p>
        </div>

        {/* Stok Display */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Stok Display
          </Label>
          <Controller
            name="displayStock"
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min="0"
                placeholder="Contoh: 20"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
              />
            )}
          />
          {errors.displayStock && (
            <p className="text-xs text-red-500">
              {errors.displayStock.message}
            </p>
          )}
          <p className="text-[11px] text-zinc-500">
            Jumlah unit stok yang dipajang di etalase dan siap ditransaksikan
            oleh kasir.
          </p>
        </div>

        {/* Summary Pill: Total Stok */}
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs flex items-center justify-between">
          <span className="text-zinc-400">Total Stok Masuk:</span>
          <span className="font-semibold text-zinc-100">{totalStock} Unit</span>
        </div>
      </CardContent>
    </Card>
  );
}
