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
import type { DiscountFormData } from "../../schemas/discountFormSchema";

interface DiscountStatusProps {
  control: Control<DiscountFormData>;
  currentStatus: "published" | "draft";
}

const statusItems = [
  { label: "Diterbitkan (Aktif)", value: "published" },
  { label: "Draf (Nonaktif)", value: "draft" },
];

export function DiscountStatus({
  control,
  currentStatus,
}: DiscountStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Diskon</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              items={statusItems}
              value={field.value || "published"}
              onValueChange={(val) => {
                if (val) {
                  field.onChange(val as "published" | "draft");
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
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            item.value === "published"
                              ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                              : "bg-amber-500"
                          }`}
                        />
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
          {currentStatus === "published"
            ? "Diskon langsung aktif dan dapat digunakan di kasir warkop."
            : "Diskon disimpan sebagai draf sementara dan belum muncul di kasir."}
        </p>
      </CardContent>
    </Card>
  );
}
