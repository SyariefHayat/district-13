import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AddProductFormData } from "../../schemas/productFormSchema";
import { Label } from "@/components/ui/label";

interface DetailProductProps {
  control: Control<AddProductFormData>;
  errors: FieldErrors<AddProductFormData>;
}

export function DetailProduct({ control, errors }: DetailProductProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Produk</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Nama Produk <span className="text-red-400">*</span>
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Contoh: Kopi Susu Racik, Indomie Goreng + Telur, dll."
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
            <Label className="text-xs md:text-sm font-medium text-zinc-300">
              SKU
            </Label>
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <Input placeholder="Contoh: KOP-1001" {...field} />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs md:text-sm font-medium text-zinc-300">
              Barcode
            </Label>
            <Controller
              name="barcode"
              control={control}
              render={({ field }) => (
                <Input placeholder="Contoh: 899123456789" {...field} />
              )}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Deskripsi (Opsional)
          </Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                rows={4}
                placeholder="Tuliskan deskripsi lengkap produk untuk informasi pelanggan..."
                className="resize-none"
                {...field}
              />
            )}
          />
          <p className="text-xs text-zinc-500">
            Tambahkan deskripsi produk untuk visibilitas dan informasi yang
            lebih baik.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
