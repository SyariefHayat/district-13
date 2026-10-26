import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AddProductFormData } from "../../schemas/productFormSchema";

interface DetailProductProps {
  control: Control<AddProductFormData>;
  errors: FieldErrors<AddProductFormData>;
}

export function DetailProduct({ control, errors }: DetailProductProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-5">
      <h2 className="text-sm md:text-base font-semibold text-zinc-100">
        Detail Produk
      </h2>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-xs md:text-sm font-medium text-zinc-300">
          Nama Produk <span className="text-red-400">*</span>
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              placeholder="Contoh: Kopi Susu Racik, Indomie Goreng + Telur, dll."
              className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
              {...field}
            />
          )}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* SKU & Barcode Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs md:text-sm font-medium text-zinc-300">
            SKU
          </label>
          <Controller
            name="sku"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Contoh: KOP-1001"
                className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
                {...field}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs md:text-sm font-medium text-zinc-300">
            Barcode
          </label>
          <Controller
            name="barcode"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Contoh: 899123456789"
                className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs md:text-sm font-medium text-zinc-300">
          Deskripsi (Opsional)
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              rows={4}
              placeholder="Tuliskan deskripsi lengkap produk untuk informasi pelanggan..."
              className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl p-3.5 resize-none focus-visible:border-zinc-600 focus-visible:ring-0"
              {...field}
            />
          )}
        />
        <p className="text-xs text-zinc-500">
          Tambahkan deskripsi produk untuk visibilitas dan informasi yang lebih
          baik.
        </p>
      </div>
    </div>
  );
}
