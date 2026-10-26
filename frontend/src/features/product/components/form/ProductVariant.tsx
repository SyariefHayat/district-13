import type { Control } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Varian</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              id: `var-${Date.now()}`,
              option: "Suhu / Penyajian",
              value: "",
              price: 0,
            })
          }
        >
          <IconPlus className="size-3.5" />
          <span>Tambah Varian</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
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
                      <SelectTrigger className="w-full text-xs">
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
                      className="text-xs"
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
                      className="text-xs"
                    />
                  )}
                />
              </div>

              {/* Delete action */}
              <div className="col-span-1 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => remove(index)}
                  className="text-zinc-500 hover:text-red-400"
                  title="Hapus varian"
                >
                  <IconTrash className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
