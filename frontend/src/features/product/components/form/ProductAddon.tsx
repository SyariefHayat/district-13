import * as React from "react";
import { IconPlus } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface BackendAddon {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
}

interface ProductAddonProps {
  addons: BackendAddon[];
  selectedAddonIds: string[];
  isLoading?: boolean;
  onToggleAddon: (id: string) => void;
  onAddNewAddon: (name: string, price: number) => Promise<boolean>;
}

export function ProductAddon({
  addons,
  selectedAddonIds,
  isLoading = false,
  onToggleAddon,
  onAddNewAddon,
}: ProductAddonProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newAddonName, setNewAddonName] = React.useState("");
  const [newAddonPrice, setNewAddonPrice] = React.useState("");
  const [isSubmittingNew, setIsSubmittingNew] = React.useState(false);

  const handleCreateAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newAddonName.trim();
    const rawPrice = newAddonPrice.replace(/\D/g, "");
    const priceNum = rawPrice ? parseInt(rawPrice, 10) : 0;

    if (!cleanName) return;

    setIsSubmittingNew(true);
    try {
      const ok = await onAddNewAddon(cleanName, priceNum);
      if (ok) {
        setNewAddonName("");
        setNewAddonPrice("");
        setIsDialogOpen(false);
      }
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add-on</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="gap-1.5 text-xs"
          >
            <IconPlus className="size-3.5" />
            <span>Tambah Add-on</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="py-6 flex justify-center text-zinc-400">
              <Spinner className="size-4" />
            </div>
          ) : addons.length === 0 ? (
            <p className="text-xs text-zinc-400 py-3 text-center">
              Belum ada add-on. Klik "Tambah Add-on" untuk membuat pilihan baru.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {addons.map((addon) => {
                const isChecked = selectedAddonIds.includes(addon.id);
                return (
                  <Label
                    key={addon.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-[#161619]/60 hover:bg-[#161619] cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggleAddon(addon.id)}
                        className="border-zinc-700 data-checked:bg-white data-checked:text-black data-checked:border-white"
                      />
                      <span className="text-xs md:text-sm font-medium text-zinc-200 truncate">
                        {addon.name}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 whitespace-nowrap">
                      +Rp {Number(addon.price).toLocaleString("id-ID")}
                    </span>
                  </Label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Tambah Add-on Baru */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm p-5 gap-4">
          <DialogTitle className="text-sm font-semibold text-zinc-100">
            Tambah Add-on Baru
          </DialogTitle>

          <form onSubmit={handleCreateAddon} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Nama Add-on</Label>
              <Input
                placeholder="Contoh: Telur Ceplok, Keju Parut..."
                value={newAddonName}
                onChange={(e) => setNewAddonName(e.target.value)}
                autoFocus
                className="text-xs md:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Harga Tambahan</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Rp 4.000"
                value={
                  newAddonPrice
                    ? `Rp ${parseInt(
                        newAddonPrice.replace(/\D/g, "") || "0",
                        10
                      ).toLocaleString("id-ID")}`
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setNewAddonPrice(raw);
                }}
                className="text-xs md:text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmittingNew}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingNew || !newAddonName.trim()}
                className="gap-1.5 text-xs"
              >
                {isSubmittingNew && <Spinner className="size-3.5" />}
                <span>Simpan</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
