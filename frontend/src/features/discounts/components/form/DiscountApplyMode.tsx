import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { IconCpu, IconHandClick } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiscountFormData } from "../../schemas/discountFormSchema";

interface DiscountApplyModeCardProps {
  control: Control<DiscountFormData>;
}

export function DiscountApplyModeCard({ control }: DiscountApplyModeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metode Penerapan di Kasir</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Controller
          name="applyMode"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Manual Kasir */}
              <button
                type="button"
                onClick={() => field.onChange("manual")}
                className={`p-3 rounded-lg border text-left transition flex items-start gap-3 cursor-pointer ${
                  field.value === "manual"
                    ? "border-primary bg-primary/10 text-white"
                    : "border-zinc-800 bg-[#141416] text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div
                  className={`p-2 rounded-md shrink-0 mt-0.5 ${
                    field.value === "manual"
                      ? "bg-primary text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <IconHandClick className="size-4" />
                </div>
                <div>
                  <span className="text-xs md:text-sm font-semibold block">
                    Manual Kasir (Rekomendasi Warkop)
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                    Tombol pilihan saat teman atau kerabat datang berkunjung ke
                    warkop.
                  </span>
                </div>
              </button>

              {/* Option 2: Otomatis */}
              <button
                type="button"
                onClick={() => field.onChange("automatic")}
                className={`p-3 rounded-lg border text-left transition flex items-start gap-3 cursor-pointer ${
                  field.value === "automatic"
                    ? "border-primary bg-primary/10 text-white"
                    : "border-zinc-800 bg-[#141416] text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div
                  className={`p-2 rounded-md shrink-0 mt-0.5 ${
                    field.value === "automatic"
                      ? "bg-primary text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <IconCpu className="size-4" />
                </div>
                <div>
                  <span className="text-xs md:text-sm font-semibold block">
                    Otomatis (Sistem)
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-tight block mt-0.5">
                    Terpotong langsung pada setiap checkout tanpa perlu kasir
                    menekan tombol.
                  </span>
                </div>
              </button>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
