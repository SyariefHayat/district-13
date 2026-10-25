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
    .min(1, "Product name is required")
    .max(120, "Name cannot exceed 120 characters"),
  sku: z.string().trim().max(30).optional(),
  barcode: z.string().trim().max(50).optional(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  images: z.array(z.string()),
  basePrice: z
    .number({ message: "Base price must be a valid number" })
    .nonnegative("Base price cannot be negative"),
  discountedPrice: z
    .number({ message: "Discounted price must be a valid number" })
    .nonnegative("Discounted price cannot be negative")
    .optional(),
  chargeTax: z.boolean(),
  inStock: z.boolean(),
  status: z.enum(["draft", "published", "archived"]),
  category: z.string().min(1, "Please select a category"),
  subCategory: z.string().optional(),
  variants: z.array(variantItemSchema),
});

export type VariantItem = z.infer<typeof variantItemSchema>;
export type AddProductFormData = z.infer<typeof addProductSchema>;
