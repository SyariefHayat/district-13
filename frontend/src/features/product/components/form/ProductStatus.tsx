import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { AddProductFormData } from "../../schemas/productFormSchema";

interface ProductStatusProps {
  control: Control<AddProductFormData>;
  currentStatus: "draft" | "published" | "archived";
}

export function ProductStatus({ control, currentStatus }: ProductStatusProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-4">
      <h2 className="text-sm md:text-base font-semibold text-zinc-100">
        Status Produk
      </h2>

      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(val) =>
              val && field.onChange(val as "draft" | "published" | "archived")
            }
          >
            <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3.5 w-full flex items-center justify-between text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    currentStatus === "published"
                      ? "bg-emerald-500"
                      : currentStatus === "draft"
                        ? "bg-amber-500"
                        : "bg-zinc-400"
                  }`}
                />
                <span className="capitalize">
                  {field.value === "published"
                    ? "Diterbitkan"
                    : field.value === "draft"
                      ? "Draf"
                      : "Diarsipkan"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
              <SelectItem value="draft">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span>Draf</span>
                </div>
              </SelectItem>
              <SelectItem value="published">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Diterbitkan</span>
                </div>
              </SelectItem>
              <SelectItem value="archived">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-zinc-400" />
                  <span>Diarsipkan</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      />

      <p className="text-xs text-zinc-500">
        Atur status ketersediaan produk di katalog penjualan.
      </p>
    </div>
  );
}
