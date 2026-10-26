import * as React from "react";
import {
  IconUpload,
  IconPhoto,
  IconLink,
  IconX,
  IconCoffee,
  IconCup,
  IconMug,
  IconBottle,
  IconSoup,
  IconToolsKitchen2,
  IconCookie,
  IconBread,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PRESET_PRODUCT_ICONS = [
  {
    id: "kopi-panas",
    name: "Kopi Panas",
    icon: IconCoffee,
    color: "text-amber-500",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Cpath d='M10 14h16v8a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-8zm16 2h2a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-2v-7zm-18 14h20v2H8v-2z' fill='%23f59e0b'/%3E%3C/svg%3E",
  },
  {
    id: "minuman-es",
    name: "Minuman Es",
    icon: IconCup,
    color: "text-sky-400",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Cpath d='M12 14l2.5 16a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8L28 14H12zm10-5l2-3h3l-3 4.5V14h-2V9z' fill='%2338bdf8'/%3E%3C/svg%3E",
  },
  {
    id: "teh-sachet",
    name: "Teh / Sachet",
    icon: IconMug,
    color: "text-emerald-400",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Cpath d='M10 13h15v10a5 5 0 0 1-5 5h-5a5 5 0 0 1-5-5V13zm15 3h3a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-3v-7z' fill='%2310b981'/%3E%3C/svg%3E",
  },
  {
    id: "minuman-kaleng",
    name: "Kaleng",
    icon: IconBottle,
    color: "text-purple-400",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Crect x='13' y='12' width='14' height='18' rx='4' fill='none' stroke='%23a855f7' stroke-width='2'/%3E%3Cpath d='M15 10h10v2H15zm3 9h4m-3 4h2' fill='none' stroke='%23a855f7' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E",
  },
  {
    id: "mie-indomie",
    name: "Indomie / Mie",
    icon: IconSoup,
    color: "text-orange-400",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Cpath d='M9 19c0 6.075 4.925 11 11 11s11-4.925 11-11H9zm1-3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1H10v-1z' fill='%23f97316'/%3E%3C/svg%3E",
  },
  {
    id: "makanan-nasi",
    name: "Nasi / Lauk",
    icon: IconToolsKitchen2,
    color: "text-rose-400",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Ccircle cx='20' cy='20' r='9' fill='none' stroke='%23f43f5e' stroke-width='2'/%3E%3Ccircle cx='20' cy='20' r='5' fill='%23f43f5e'/%3E%3Cpath d='M7 13v14m24-14v14' fill='none' stroke='%23f43f5e' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E",
  },
  {
    id: "gorengan-snack",
    name: "Gorengan",
    icon: IconCookie,
    color: "text-yellow-400",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Cpath d='M20 10a10 10 0 0 0-10 10v2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-2a10 10 0 0 0-10-10zm-4 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z' fill='%23eab308'/%3E%3C/svg%3E",
  },
  {
    id: "roti-bakar",
    name: "Roti Bakar",
    icon: IconBread,
    color: "text-amber-400",
    svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%231c1c20'/%3E%3Cpath d='M12 16c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6v11a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V16zm4 2h8v5h-8v-5z' fill='%23d97706'/%3E%3C/svg%3E",
  },
];

interface ProductImageProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ProductImage({ images, onChange }: ProductImageProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [showUrlModal, setShowUrlModal] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState("");

  const handleAddUrlImage = () => {
    if (!urlInput || !urlInput.trim()) return;
    onChange([...images, urlInput.trim()]);
    setUrlInput("");
    setShowUrlModal(false);
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, idx) => idx !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange([...images, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Foto Produk</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setShowUrlModal(!showUrlModal)}
          className="text-xs text-zinc-400 hover:text-white"
        >
          Tambah media dari URL
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* URL input modal/toggle */}
        {showUrlModal && (
          <div className="flex items-center gap-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg">
            <IconLink className="size-4 text-zinc-400 shrink-0" />
            <Input
              placeholder="https://contoh.com/gambar.png"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
            />
            <Button type="button" size="sm" onClick={handleAddUrlImage}>
              Tambah
            </Button>
          </div>
        )}

        {/* Upload Dropzone (Bigger & More Spacious) */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-zinc-800/90 rounded-xl bg-[#0d0d0f] p-10 md:p-14 min-h-[200px] flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <div className="size-14 rounded-xl bg-[#1c1c20] flex items-center justify-center text-zinc-400 shadow-inner">
            <IconPhoto className="size-7" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-medium text-zinc-200">
              Tarik & lepas gambar di sini
            </p>
            <p className="text-xs text-zinc-500">PNG atau JPG (maks. 5MB)</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-2 gap-2"
          >
            <IconUpload className="size-4" />
            <span>Pilih gambar</span>
          </Button>
        </div>

        {/* Preset Icon Selection (Pure icons without text descriptions) */}
        {images.length === 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-xs text-zinc-400 font-medium">
              Atau gunakan ikon cepat:
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PRESET_PRODUCT_ICONS.map((preset) => {
                const IconComp = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange([preset.svg])}
                    title={preset.name}
                    className="size-10 sm:size-11 rounded-lg border border-zinc-800 bg-[#0d0d0f] hover:border-zinc-600 hover:bg-zinc-800/70 transition-all flex items-center justify-center cursor-pointer group"
                  >
                    <IconComp
                      className={`size-5 ${preset.color} group-hover:scale-110 transition-transform`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Uploaded / Selected Thumbnails Grid (Bigger preview) */}
        {images.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Foto / Ikon Terpilih:
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => onChange([])}
                className="text-xs text-zinc-500 hover:text-red-400 h-6 px-1.5"
              >
                Ganti gambar
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative size-24 md:size-28 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex items-center justify-center shadow-md"
                >
                  <img
                    src={img}
                    alt="Pratinjau foto produk"
                    className="size-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus gambar"
                  >
                    <IconX className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
