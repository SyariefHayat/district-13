import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Kategori</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
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
                <SelectTrigger className="flex-1 flex items-center justify-between text-xs md:text-sm">
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAddCategory}
            title="Tambah kategori baru"
          >
            <IconPlus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDeleteCategory}
            disabled={!currentCategory || isDeletingCategory}
            title="Hapus kategori terpilih"
            className="hover:text-red-400"
          >
            <IconTrash className="size-4" />
          </Button>
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
                <SelectTrigger className="flex-1 flex items-center justify-between text-xs md:text-sm">
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAddSubCategory}
            title="Tambah sub-kategori baru"
          >
            <IconPlus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDeleteSubCategory}
            disabled={!currentSubCategory}
            title="Hapus sub-kategori terpilih"
            className="hover:text-red-400"
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
