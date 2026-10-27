import * as React from "react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onAddCategory: (name: string) => Promise<boolean | void> | void;
  onDeleteCategory: () => Promise<boolean | void> | void;
  onAddSubCategory: (name: string) => void;
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
  const [isAddCatOpen, setIsAddCatOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [isSubmittingCat, setIsSubmittingCat] = React.useState(false);

  const [isAddSubOpen, setIsAddSubOpen] = React.useState(false);
  const [newSubName, setNewSubName] = React.useState("");

  const [isDeleteCatAlertOpen, setIsDeleteCatAlertOpen] = React.useState(false);
  const [isDeleteSubAlertOpen, setIsDeleteSubAlertOpen] = React.useState(false);

  const selectedCatObj = categoriesList.find(
    (c) => c.id === currentCategory || c.name === currentCategory
  );
  const selectedCategoryName = selectedCatObj
    ? selectedCatObj.name
    : "kategori";

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed || isSubmittingCat) return;

    setIsSubmittingCat(true);
    try {
      const res = await onAddCategory(trimmed);
      if (res !== false) {
        setNewCatName("");
        setIsAddCatOpen(false);
      }
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleSubCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubName.trim();
    if (!trimmed) return;
    onAddSubCategory(trimmed);
    setNewSubName("");
    setIsAddSubOpen(false);
  };

  return (
    <>
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
              onClick={() => setIsAddCatOpen(true)}
              title="Tambah kategori baru"
            >
              <IconPlus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteCatAlertOpen(true)}
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
              onClick={() => setIsAddSubOpen(true)}
              title="Tambah sub-kategori baru"
            >
              <IconPlus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteSubAlertOpen(true)}
              disabled={!currentSubCategory}
              title="Hapus sub-kategori terpilih"
              className="hover:text-red-400"
            >
              <IconTrash className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Tambah Kategori (Simple & Clean) */}
      <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
        <DialogContent className="sm:max-w-xs p-4 gap-3">
          <DialogTitle className="text-sm font-semibold text-zinc-100">
            Tambah Kategori
          </DialogTitle>

          <form
            onSubmit={handleCategorySubmit}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Nama kategori..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button
              type="submit"
              size="default"
              disabled={!newCatName.trim() || isSubmittingCat}
              className="gap-1.5"
            >
              {isSubmittingCat && <Spinner className="size-3.5" />}
              <span>{isSubmittingCat ? "Menyimpan..." : "Tambah"}</span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah Sub-Kategori (Simple & Clean) */}
      <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
        <DialogContent className="sm:max-w-xs p-4 gap-3">
          <DialogTitle className="text-sm font-semibold text-zinc-100">
            Tambah Sub-kategori
          </DialogTitle>

          <form
            onSubmit={handleSubCategorySubmit}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Nama sub-kategori..."
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button type="submit" size="default" disabled={!newSubName.trim()}>
              Tambah
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Hapus Kategori */}
      <AlertDialog
        open={isDeleteCatAlertOpen}
        onOpenChange={setIsDeleteCatAlertOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori &ldquo;
              {selectedCategoryName}&rdquo;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingCategory}
              onClick={async () => {
                await onDeleteCategory();
                setIsDeleteCatAlertOpen(false);
              }}
              className="gap-1.5"
            >
              {isDeletingCategory && <Spinner className="size-3.5" />}
              <span>{isDeletingCategory ? "Menghapus..." : "Hapus"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog Hapus Sub-kategori */}
      <AlertDialog
        open={isDeleteSubAlertOpen}
        onOpenChange={setIsDeleteSubAlertOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sub-kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus sub-kategori &ldquo;
              {currentSubCategory}&rdquo;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onDeleteSubCategory();
                setIsDeleteSubAlertOpen(false);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
