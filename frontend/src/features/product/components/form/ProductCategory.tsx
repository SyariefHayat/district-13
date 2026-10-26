import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddProductFormData } from "../../schemas/productFormSchema";

interface ProductCategoryProps {
  control: Control<AddProductFormData>;
  categoriesList: { id: string; name: string }[];
  categoryItems: Record<string, string>;
  subCategories: string[];
  currentCategory: string;
  currentSubCategory?: string;
  isDeletingCategory: boolean;
  onCategoryChange: (val: string | null) => void;
  onAddCategory: () => void;
  onDeleteCategory: () => void;
  onAddSubCategory: () => void;
  onDeleteSubCategory: () => void;
}

export function ProductCategory({
  control,
  categoriesList,
  categoryItems,
  subCategories,
  currentCategory,
  currentSubCategory,
  isDeletingCategory,
  onCategoryChange,
  onAddCategory,
  onDeleteCategory,
  onAddSubCategory,
  onDeleteSubCategory,
}: ProductCategoryProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-4">
      <h2 className="text-sm md:text-base font-semibold text-zinc-100">
        Kategori
      </h2>

      {/* Category Select with (+) and trash buttons */}
      <div className="flex items-center gap-2">
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select
              items={categoryItems}
              value={field.value}
              onValueChange={onCategoryChange}
            >
              <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3.5 flex-1 flex items-center justify-between text-xs md:text-sm">
                <SelectValue placeholder="Pilih kategori">
                  {(val: string | null) => {
                    if (!val) return "Pilih kategori";
                    const found = categoriesList.find(
                      (c) => c.id === val || c.name === val
                    );
                    return found ? found.name : "Pilih kategori";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
                {categoriesList.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <button
          type="button"
          onClick={onAddCategory}
          className="size-10 rounded-xl border border-zinc-800 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title="Tambah kategori baru"
        >
          <IconPlus className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDeleteCategory}
          disabled={!currentCategory || isDeletingCategory}
          className="size-10 rounded-xl border border-zinc-800 bg-[#18181b] hover:bg-red-950/40 hover:border-red-900/50 text-zinc-400 hover:text-red-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Hapus kategori terpilih"
        >
          <IconTrash className="size-4" />
        </button>
      </div>

      {/* Sub Category Select with (+) and trash buttons */}
      <div className="flex items-center gap-2">
        <Controller
          name="subCategory"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(val) => val && field.onChange(val)}
            >
              <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3.5 flex-1 flex items-center justify-between text-xs md:text-sm">
                <SelectValue placeholder="Pilih sub-kategori" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
                {subCategories.length === 0 ? (
                  <div className="p-2 text-xs text-zinc-500 text-center">
                    Tidak ada sub-kategori
                  </div>
                ) : (
                  subCategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        <button
          type="button"
          onClick={onAddSubCategory}
          className="size-10 rounded-xl border border-zinc-800 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title="Tambah sub-kategori baru"
        >
          <IconPlus className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDeleteSubCategory}
          disabled={!currentSubCategory}
          className="size-10 rounded-xl border border-zinc-800 bg-[#18181b] hover:bg-red-950/40 hover:border-red-900/50 text-zinc-400 hover:text-red-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Hapus sub-kategori terpilih"
        >
          <IconTrash className="size-4" />
        </button>
      </div>
    </div>
  );
}
