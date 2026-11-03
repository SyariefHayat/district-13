import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { IconSparkles } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { DiscountFormData } from "../../schemas/discountFormSchema";

interface DetailDiscountProps {
  control: Control<DiscountFormData>;
  errors: FieldErrors<DiscountFormData>;
  setValue: UseFormSetValue<DiscountFormData>;
  applyMode: "manual" | "automatic";
}

export function DetailDiscount({
  control,
  errors,
  setValue,
  applyMode,
}: DetailDiscountProps) {
  const handleGenerateCode = () => {
    const prefix = applyMode === "automatic" ? "AUTO" : "TEMAN";
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setValue("code", `${prefix}-${randomSuffix}`, { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Diskon</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Nama Diskon */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Nama Diskon <span className="text-red-400">*</span>
          </Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Contoh: Diskon Teman Nongkrong 20%, Potongan Sahabat Rp 5.000"
                {...field}
              />
            )}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
          <p className="text-xs text-zinc-500">
            Nama diskon ini akan tercetak pada struk pesanan dan rincian
            transaksi kasir warkop.
          </p>
        </div>

        {/* Kode Diskon / Referensi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs md:text-sm font-medium text-zinc-300">
              Kode Referensi / Kupon
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateCode}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-white gap-1"
            >
              <IconSparkles className="size-3.5 text-amber-400" />
              <span>Buat Kode Acak</span>
            </Button>
          </div>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Contoh: TEMAN-20, SOBAT-5K, NONGKRONG-10"
                className="font-mono uppercase tracking-wider text-xs md:text-sm"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              />
            )}
          />
          {errors.code && (
            <p className="text-xs text-red-500">{errors.code.message}</p>
          )}
          <p className="text-xs text-zinc-500">
            Kode unik pembeda saat kasir mencari atau memasukkan kupon di sistem
            POS.
          </p>
        </div>

        {/* Deskripsi */}
        <div className="space-y-2">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Keterangan / Catatan (Opsional)
          </Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                rows={3}
                placeholder="Catatan tambahan untuk kasir, misalnya: Khusus kawan akrab pemilik warkop yang datang nongkrong..."
                className="resize-none"
                value={field.value || ""}
                onChange={field.onChange}
              />
            )}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
          <p className="text-xs text-zinc-500">
            Memberikan kejelasan bagi staf kasir mengenai aturan dan sasaran
            pemberian diskon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
