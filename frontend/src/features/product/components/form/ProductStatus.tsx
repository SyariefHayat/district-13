import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddProductFormData } from "../../schemas/productFormSchema";

interface ProductStatusProps {
  control: Control<AddProductFormData>;
  currentStatus: "draft" | "published" | "archived";
}

const statusItems = [
  { label: "Pilih status", value: null },
  { label: "Diterbitkan", value: "published" },
  { label: "Draf", value: "draft" },
  { label: "Diarsipkan", value: "archived" },
];

export function ProductStatus({ control }: ProductStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Produk</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              items={statusItems}
              value={field.value || null}
              onValueChange={(val) => {
                if (val) {
                  field.onChange(val as "draft" | "published" | "archived");
                }
              }}
            >
              <SelectTrigger className="w-full flex items-center justify-between text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={true}
                className="bg-[#18181b] border-zinc-800 text-zinc-200"
              >
                <SelectGroup>
                  {statusItems.map((item) => (
                    <SelectItem
                      key={item.value ?? "empty-status"}
                      value={item.value}
                    >
                      <div className="flex items-center gap-2">
                        {item.value && (
                          <span
                            className={`size-2 rounded-full ${
                              item.value === "published"
                                ? "bg-emerald-500"
                                : item.value === "draft"
                                  ? "bg-amber-500"
                                  : "bg-zinc-400"
                            }`}
                          />
                        )}
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />

        <p className="text-xs text-zinc-500">
          Atur status ketersediaan produk di katalog penjualan.
        </p>
      </CardContent>
    </Card>
  );
}
