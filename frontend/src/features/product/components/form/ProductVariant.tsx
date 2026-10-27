import * as React from "react";
import type { Control } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import {
  IconPlus,
  IconMinus,
  IconTrash,
  IconSettings,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export const DEFAULT_VARIANT_OPTIONS = [
  "Suhu / Penyajian",
  "Topping",
  "Level Pedas",
  "Pilihan Rasa",
  "Porsi / Ukuran",
  "Tingkat Gula",
  "Tingkat Es",
];

export const VARIANT_OPTIONS = DEFAULT_VARIANT_OPTIONS;

const STORAGE_KEY = "district13_variant_options";

function formatRupiah(value?: number): string {
  if (value === undefined || value === null || value === 0) return "";
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function parseRupiah(raw: string): number {
  const clean = raw.replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

interface ProductVariantProps {
  control: Control<AddProductFormData>;
}

export function ProductVariant({ control }: ProductVariantProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const [optionsList, setOptionsList] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_VARIANT_OPTIONS;
  });

  const [isManageOptionsOpen, setIsManageOptionsOpen] = React.useState(false);
  const [newOptionInput, setNewOptionInput] = React.useState("");
  const [optionToDelete, setOptionToDelete] = React.useState<string | null>(
    null
  );

  const handleAddOption = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || optionsList.includes(trimmed)) return;
    const next = [...optionsList, trimmed];
    setOptionsList(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setNewOptionInput("");
  };

  const handleDeleteOption = (target: string) => {
    const next = optionsList.filter((o) => o !== target);
    setOptionsList(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setOptionToDelete(null);
  };

  const variantOptionItems = React.useMemo(
    () => [
      { label: "Pilih opsi", value: null },
      ...optionsList.map((opt) => ({ label: opt, value: opt })),
    ],
    [optionsList]
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Varian</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsManageOptionsOpen(true)}
          >
            <IconSettings className="size-3.5" />
            <span>Kelola Opsi</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Variants Table / Grid */}
          <div className="space-y-3">
            {/* Headers */}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300 px-1">
              <div className="flex-[4] min-w-0">Opsi</div>
              <div className="flex-[4] min-w-0">Nilai</div>
              <div className="flex-[3] min-w-0">Harga Tambahan</div>
              <div className="w-[72px] shrink-0"></div>
            </div>

            {/* Rows */}
            {fields.length === 0 ? (
              <div className="py-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      id: `var-${Date.now()}`,
                      option: "",
                      value: "",
                      price: 0,
                    })
                  }
                  className="gap-1.5 text-xs"
                >
                  <IconPlus className="size-3.5" />
                  <span>Tambah Baris Varian</span>
                </Button>
              </div>
            ) : (
              fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="flex items-center gap-2">
                  {/* Option Select */}
                  <div className="flex-[4] min-w-0">
                    <Controller
                      name={`variants.${index}.option`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          items={variantOptionItems}
                          value={field.value || null}
                          onValueChange={(val) => field.onChange(val || "")}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent
                            alignItemWithTrigger={true}
                            className="bg-[#18181b] border-zinc-800 text-zinc-200"
                          >
                            <SelectGroup>
                              {variantOptionItems.map((opt) => (
                                <SelectItem
                                  key={opt.value ?? "empty-opt"}
                                  value={opt.value}
                                >
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Value Input */}
                  <div className="flex-[4] min-w-0">
                    <Controller
                      name={`variants.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="Contoh: Panas, Dingin / Es, + Telur, dll."
                          className="text-xs"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  {/* Price Input */}
                  <div className="flex-[3] min-w-0">
                    <Controller
                      name={`variants.${index}.price`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Rp"
                          value={formatRupiah(field.value)}
                          onChange={(e) =>
                            field.onChange(parseRupiah(e.target.value))
                          }
                          className="text-xs"
                        />
                      )}
                    />
                  </div>

                  {/* Action buttons: (+) and (-) */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      append({
                        id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        option: "",
                        value: "",
                        price: 0,
                      })
                    }
                    title="Tambah varian"
                  >
                    <IconPlus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    className="hover:text-red-400"
                    title="Hapus varian"
                  >
                    <IconMinus className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Kelola Opsi Varian */}
      <Dialog open={isManageOptionsOpen} onOpenChange={setIsManageOptionsOpen}>
        <DialogContent className="sm:max-w-sm p-4 gap-3">
          <DialogTitle className="text-sm font-semibold text-zinc-100">
            Kelola Opsi Varian
          </DialogTitle>

          {/* Form input opsi baru */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddOption(newOptionInput);
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Nama opsi (cth: Jenis Susu)..."
              value={newOptionInput}
              onChange={(e) => setNewOptionInput(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button
              type="submit"
              size="default"
              disabled={!newOptionInput.trim()}
            >
              Tambah
            </Button>
          </form>

          {/* List opsi yang tersedia dengan tombol hapus */}
          <ScrollArea className="h-52 pr-2">
            <div className="space-y-1.5">
              {optionsList.map((opt) => (
                <div
                  key={opt}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 text-xs text-zinc-200"
                >
                  <span>{opt}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() => setOptionToDelete(opt)}
                    className="hover:text-red-400"
                    title={`Hapus opsi ${opt}`}
                  >
                    <IconTrash className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Konfirmasi Hapus Opsi */}
      <AlertDialog
        open={Boolean(optionToDelete)}
        onOpenChange={(open) => !open && setOptionToDelete(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Opsi Varian?</AlertDialogTitle>
            <AlertDialogDescription>
              Opsi &ldquo;{optionToDelete}&rdquo; akan dihapus dari daftar
              pilihan varian produk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                optionToDelete && handleDeleteOption(optionToDelete)
              }
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
