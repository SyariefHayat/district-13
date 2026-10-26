import * as React from "react";
import { IconUpload, IconPhoto, IconLink, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

        {/* Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-zinc-800/90 rounded-lg bg-[#0d0d0f] p-8 md:p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <div className="size-11 rounded-lg bg-[#1c1c20] flex items-center justify-center text-zinc-400">
            <IconPhoto className="size-5" />
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-medium text-zinc-200">
              Tarik & lepas gambar di sini
            </p>
            <p className="text-xs text-zinc-500">PNG atau JPG (maks. 5MB)</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-2 gap-1.5"
          >
            <IconUpload className="size-3.5" />
            <span>Pilih gambar</span>
          </Button>
        </div>

        {/* Uploaded Thumbnails Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="group relative size-18 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden"
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
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus gambar"
                >
                  <IconX className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
