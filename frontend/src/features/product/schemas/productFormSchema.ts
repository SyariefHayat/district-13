import { z } from "zod";

export const addProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter")
    .max(120, "Nama produk maksimal 120 karakter"),
  sku: z
    .string()
    .trim()
    .min(2, "Kode SKU minimal 2 karakter")
    .max(30, "Kode SKU maksimal 30 karakter"),
  barcode: z.string().trim().max(50).optional(),
  category: z.string().min(1, "Silakan pilih kategori produk"),
  price: z
    .number({ message: "Harga harus berupa angka valid" })
    .positive("Harga jual harus lebih dari 0"),
  costPrice: z
    .number({ message: "Harga modal harus berupa angka" })
    .nonnegative("Harga modal tidak boleh negatif")
    .optional(),
  trackStock: z.boolean(),
  stock: z
    .number({ message: "Stok harus berupa angka" })
    .int("Stok harus berupa bilangan bulat")
    .nonnegative("Stok tidak boleh negatif"),
  minStock: z
    .number({ message: "Batas stok harus berupa angka" })
    .int()
    .nonnegative(),
  isAvailable: z.boolean(),
  isActive: z.boolean(),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional(),
  tags: z.string().max(100).optional(),
  image: z.string().optional(),
});

export type AddProductFormData = z.infer<typeof addProductSchema>;
