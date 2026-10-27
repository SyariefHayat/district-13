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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddProductFormData } from "../../schemas/productFormSchema";

export interface SubCategoryItem {
  id: string;
  name: string;
}

interface ProductCategoryProps {
  control: Control<AddProductFormData>;
  categoriesList: { id: string; name: string }[];
  subCategories: SubCategoryItem[];
  currentCategory: string;
  currentSubCategory?: string;
  isDeletingCategory: boolean;
  isDeletingSubCategory?: boolean;
  isLoadingSubCategories?: boolean;
  onCategoryChange: (val: string | null) => void;
  onAddCategory: (name: string) => Promise<boolean | void> | void;
  onDeleteCategory: () => Promise<boolean | void> | void;
  onAddSubCategory: (name: string) => Promise<boolean | void> | void;
  onDeleteSubCategory: () => Promise<boolean | void> | void;
}

export function ProductCategory({
  control,
  categoriesList,
  subCategories,
  currentCategory,
  currentSubCategory,
  isDeletingCategory,
  isDeletingSubCategory = false,
  isLoadingSubCategories = false,
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
  const [isSubmittingSub, setIsSubmittingSub] = React.useState(false);

  const [isDeleteCatAlertOpen, setIsDeleteCatAlertOpen] = React.useState(false);
  const [isDeleteSubAlertOpen, setIsDeleteSubAlertOpen] = React.useState(false);

  const selectedCatObj = categoriesList.find(
    (c) => c.id === currentCategory || c.name === currentCategory
  );
  const selectedCategoryName = selectedCatObj
    ? selectedCatObj.name
    : "kategori";

  const selectedSubObj = subCategories.find(
    (s) => s.id === currentSubCategory || s.name === currentSubCategory
  );
  const selectedSubCategoryName = selectedSubObj
    ? selectedSubObj.name
    : "sub-kategori";

  const categorySelectItems = React.useMemo(
    () => [
      { label: "Pilih kategori", value: null },
      ...categoriesList.map((cat) => ({ label: cat.name, value: cat.id })),
    ],
    [categoriesList]
  );

  const subCategorySelectItems = React.useMemo(
    () => [
      {
        label: isLoadingSubCategories
          ? "Memuat sub-kategori..."
          : "Pilih sub-kategori",
        value: null,
      },
      ...subCategories.map((sub) => ({ label: sub.name, value: sub.id })),
    ],
    [subCategories, isLoadingSubCategories]
  );

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

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubName.trim();
    if (!trimmed || isSubmittingSub) return;

    setIsSubmittingSub(true);
    try {
      const res = await onAddSubCategory(trimmed);
      if (res !== false) {
        setNewSubName("");
        setIsAddSubOpen(false);
      }
    } finally {
      setIsSubmittingSub(false);
    }
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
                  items={categorySelectItems}
                  value={field.value || null}
                  onValueChange={onCategoryChange}
                >
                  <SelectTrigger className="flex-1 flex items-center justify-between text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={true}
                    className="bg-[#18181b] border-zinc-800 text-zinc-200"
                  >
                    <SelectGroup>
                      {categorySelectItems.map((item) => (
                        <SelectItem
                          key={item.value ?? "empty-cat"}
                          value={item.value}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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
                  items={subCategorySelectItems}
                  value={field.value || null}
                  onValueChange={(val) => field.onChange(val || "")}
                >
                  <SelectTrigger className="flex-1 flex items-center justify-between text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={true}
                    className="bg-[#18181b] border-zinc-800 text-zinc-200"
                  >
                    <SelectGroup>
                      {subCategorySelectItems.map((item) => (
                        <SelectItem
                          key={item.value ?? "empty-sub"}
                          value={item.value}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsAddSubOpen(true)}
              disabled={!currentCategory}
              title="Tambah sub-kategori baru"
            >
              <IconPlus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteSubAlertOpen(true)}
              disabled={!currentSubCategory || isDeletingSubCategory}
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
            <Button
              type="submit"
              size="default"
              disabled={!newSubName.trim() || isSubmittingSub}
              className="gap-1.5"
            >
              {isSubmittingSub && <Spinner className="size-3.5" />}
              <span>{isSubmittingSub ? "Menyimpan..." : "Tambah"}</span>
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
              {selectedSubCategoryName}&rdquo;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSubCategory}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingSubCategory}
              onClick={async () => {
                await onDeleteSubCategory();
                setIsDeleteSubAlertOpen(false);
              }}
              className="gap-1.5"
            >
              {isDeletingSubCategory && <Spinner className="size-3.5" />}
              <span>{isDeletingSubCategory ? "Menghapus..." : "Hapus"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
