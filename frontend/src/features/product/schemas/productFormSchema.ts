import { z } from "zod";

export const variantItemSchema = z.object({
  id: z.string(),
  option: z.string(),
  value: z.string(),
  price: z.number().nonnegative(),
});

export const addProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama produk wajib diisi")
    .max(120, "Nama tidak boleh melebihi 120 karakter"),
  sku: z.string().trim().max(30).optional(),
  barcode: z.string().trim().max(50).optional(),
  description: z
    .string()
    .max(1000, "Deskripsi tidak boleh melebihi 1000 karakter")
    .optional(),
  images: z.array(z.string()),
  price: z
    .number({ message: "Harga jual harus berupa angka yang valid" })
    .nonnegative("Harga jual tidak boleh bernilai negatif"),
  costPrice: z
    .number({ message: "Harga HPP harus berupa angka yang valid" })
    .nonnegative("Harga HPP tidak boleh bernilai negatif")
    .optional(),
  chargeTax: z.boolean(),
  inStock: z.boolean(),
  warehouseStock: z
    .number({ message: "Stok gudang harus berupa angka" })
    .int("Stok gudang harus berupa bilangan bulat")
    .nonnegative("Stok gudang tidak boleh negatif"),
  displayStock: z
    .number({ message: "Stok display harus berupa angka" })
    .int("Stok display harus berupa bilangan bulat")
    .nonnegative("Stok display tidak boleh negatif"),
  status: z.enum(["draft", "published", "archived"]),
  category: z.string().min(1, "Silakan pilih kategori"),
  subCategory: z.string().optional(),
  variants: z.array(variantItemSchema),
});

export type VariantItem = z.infer<typeof variantItemSchema>;
export type AddProductFormData = z.infer<typeof addProductSchema>;
