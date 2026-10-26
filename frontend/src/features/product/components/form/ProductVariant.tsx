import type { Control } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddProductFormData } from "../../schemas/productFormSchema";

export const VARIANT_OPTIONS = [
  "Suhu / Penyajian",
  "Topping",
  "Level Pedas",
  "Pilihan Rasa",
  "Porsi / Ukuran",
  "Tingkat Gula",
  "Tingkat Es",
];

interface ProductVariantProps {
  control: Control<AddProductFormData>;
}

export function ProductVariant({ control }: ProductVariantProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm md:text-base font-semibold text-zinc-100">
          Varian
        </h2>
        <button
          type="button"
          onClick={() =>
            append({
              id: `var-${Date.now()}`,
              option: "Suhu / Penyajian",
              value: "",
              price: 0,
            })
          }
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-[#1c1c20] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
        >
          <IconPlus className="size-3.5" />
          <span>Tambah Varian</span>
        </button>
      </div>

      {/* Variants Table / Grid */}
      <div className="space-y-3">
        {/* Headers */}
        <div className="grid grid-cols-12 gap-3 text-xs font-medium text-zinc-300 px-1">
          <div className="col-span-4">Opsi</div>
          <div className="col-span-4">Nilai</div>
          <div className="col-span-3">Harga Tambahan</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        {fields.map((fieldItem, index) => (
          <div
            key={fieldItem.id}
            className="grid grid-cols-12 gap-3 items-center"
          >
            {/* Option Select */}
            <div className="col-span-4">
              <Controller
                name={`variants.${index}.option`}
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                  >
                    <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3 w-full text-xs">
                      <SelectValue placeholder="Pilih opsi" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
                      {VARIANT_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Value Input */}
            <div className="col-span-4">
              <Controller
                name={`variants.${index}.value`}
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Contoh: Panas, Dingin / Es, + Telur, dll."
                    className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3 text-xs focus-visible:border-zinc-600 focus-visible:ring-0"
                    {...field}
                  />
                )}
              />
            </div>

            {/* Price Input */}
            <div className="col-span-3">
              <Controller
                name={`variants.${index}.price`}
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3 text-xs focus-visible:border-zinc-600 focus-visible:ring-0"
                  />
                )}
              />
            </div>

            {/* Delete action */}
            <div className="col-span-1 flex justify-center">
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                title="Hapus varian"
              >
                <IconTrash className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
