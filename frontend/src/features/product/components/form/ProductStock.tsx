import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
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
    <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-5">
      <h2 className="text-sm md:text-base font-semibold text-zinc-100">Stok</h2>

      {/* Stok Gudang */}
      <div className="space-y-2">
        <label className="text-xs md:text-sm font-medium text-zinc-300">
          Stok Gudang
        </label>
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
              className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
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
        <label className="text-xs md:text-sm font-medium text-zinc-300">
          Stok Display
        </label>
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
              className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
            />
          )}
        />
        {errors.displayStock && (
          <p className="text-xs text-red-500">{errors.displayStock.message}</p>
        )}
        <p className="text-[11px] text-zinc-500">
          Jumlah unit stok yang dipajang di etalase dan siap ditransaksikan oleh
          kasir.
        </p>
      </div>

      {/* Summary Pill: Total Stok */}
      <div className="rounded-xl border border-zinc-800 bg-[#161619] p-3 text-xs flex items-center justify-between">
        <span className="text-zinc-400">Total Stok Masuk:</span>
        <span className="font-semibold text-zinc-100">{totalStock} Unit</span>
      </div>
    </div>
  );
}
