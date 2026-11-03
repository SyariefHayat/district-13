import { z } from "zod";

export const discountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama diskon wajib diisi")
    .max(100, "Nama tidak boleh melebihi 100 karakter"),
  code: z
    .string()
    .trim()
    .max(50, "Kode tidak boleh melebihi 50 karakter")
    .optional(),
  type: z.enum(["percentage", "fixed"]),
  applyMode: z.enum(["manual", "automatic"]),
  value: z
    .number({ message: "Besar diskon harus berupa angka yang valid" })
    .positive("Besar diskon harus lebih besar dari 0"),
  minPurchase: z
    .number({ message: "Minimal belanja harus berupa angka" })
    .nonnegative("Minimal belanja tidak boleh bernilai negatif"),
  maxDiscount: z
    .number({ message: "Maksimal potongan harus berupa angka" })
    .nonnegative("Maksimal potongan tidak boleh negatif")
    .optional()
    .nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z
    .string()
    .max(255, "Deskripsi tidak boleh melebihi 255 karakter")
    .optional()
    .nullable(),
  status: z.enum(["published", "draft"]),
});

export type DiscountFormData = z.infer<typeof discountFormSchema>;
