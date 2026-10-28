import * as React from "react";
import {
  IconCurrencyDollar,
  IconTruck,
  IconStack2,
  IconReceiptTax,
  IconSparkles,
  IconBuildingWarehouse,
  IconCash,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatIDR, getPresetImageForCategory } from "../data/productData";

export interface ProductDetailAddon {
  id: string;
  name: string;
  price: string | number;
  isActive?: boolean;
}

export interface ProductDetailVariant {
  id?: string;
  option?: string;
  value?: string;
  price?: number;
}

export interface ProductDetailData {
  id?: string;
  name?: string;
  seller?: string;
  publishedDate?: string;
  sku?: string;
  barcode?: string;
  price?: number | string;
  costPrice?: number | string;
  ordersCount?: number | string;
  availableStock?: number | string;
  warehouseStock?: number | string;
  displayStock?: number | string;
  totalRevenue?: number | string;
  category?: string;
  categoryId?: string;
  subCategory?: string;
  subCategoryId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  description?: string;
  image?: string;
  variants?: ProductDetailVariant[];
  addons?: ProductDetailAddon[];
}

export interface ProductDetailProps {
  product?: ProductDetailData;
  className?: string;
}

export function ProductDetail({ product, className }: ProductDetailProps) {
  const name = product?.name ?? "Produk";
  const category = product?.category ?? "General";
  const subCategory = product?.subCategory ?? "";

  // Pricing & Metrics
  const rawPrice =
    typeof product?.price === "number"
      ? formatIDR(product.price)
      : (product?.price ?? "Rp 0");

  const costPrice =
    typeof product?.costPrice === "number"
      ? formatIDR(product.costPrice)
      : product?.costPrice;

  const ordersCount =
    product?.ordersCount !== undefined ? String(product.ordersCount) : "0";

  const availableStock =
    product?.availableStock !== undefined
      ? String(product.availableStock)
      : "0";

  const warehouseStock = product?.warehouseStock ?? "0";
  const displayStock = product?.displayStock ?? "0";

  const totalRevenue =
    typeof product?.totalRevenue === "number"
      ? formatIDR(product.totalRevenue)
      : (product?.totalRevenue ?? "Rp 0");

  const description =
    product?.description ||
    `Produk katalog ${category}${
      subCategory ? ` (${subCategory})` : ""
    } dengan mutu standar toko, siap dijual di kasir dan terhubung dengan sistem inventaris realtime.`;

  const addons = product?.addons ?? [];
  const variants = product?.variants ?? [];

  // Single Image with fallback to category preset
  const imageSrc = React.useMemo(() => {
    if (product?.image) return product.image;
    return getPresetImageForCategory(category);
  }, [product?.image, category]);

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn("w-full space-y-6 text-zinc-100", className)}>
      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sticky Product Image (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 self-start space-y-5">
          {/* Foto Produk Card */}
          <Card className="bg-[#121215] border-zinc-800 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-300">
                  Foto Produk
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs text-zinc-400 border-zinc-800"
                >
                  {category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-square rounded-2xl bg-[#18181b] border border-zinc-800 overflow-hidden flex items-center justify-center p-6 sm:p-8">
                {imgError ? (
                  <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <IconStack2 className="size-16 stroke-1 text-zinc-600" />
                    <span className="text-xs">Foto Produk</span>
                  </div>
                ) : (
                  <img
                    src={imageSrc}
                    alt={name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detail Informasi, Rincian Stok & Add-ons (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Details Card */}
          <Card className="bg-[#121215] border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                Detail Informasi Produk
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Ringkasan performa penjualan dan spesifikasi produk
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Stats Cards Grid (Using Shadcn Card Components) */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Stat 1: Price */}
                <Card className="bg-[#18181b] border-zinc-800/80">
                  <CardHeader className="pb-1.5">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs font-medium text-zinc-400">
                        Harga Jual
                      </CardDescription>
                      <div className="size-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
                        <IconCurrencyDollar className="size-3.5" />
                      </div>
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-white tracking-tight pt-0.5">
                      {rawPrice}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-zinc-500">
                    Katalog aktif
                  </CardContent>
                </Card>

                {/* Stat 2: Orders Count */}
                <Card className="bg-[#18181b] border-zinc-800/80">
                  <CardHeader className="pb-1.5">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs font-medium text-zinc-400">
                        Total Terjual
                      </CardDescription>
                      <div className="size-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
                        <IconTruck className="size-3.5" />
                      </div>
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-white tracking-tight pt-0.5">
                      {ordersCount} pcs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-zinc-500">
                    Transaksi selesai
                  </CardContent>
                </Card>

                {/* Stat 3: Available Stock */}
                <Card className="bg-[#18181b] border-zinc-800/80">
                  <CardHeader className="pb-1.5">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs font-medium text-zinc-400">
                        Stok Total
                      </CardDescription>
                      <div className="size-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
                        <IconStack2 className="size-3.5" />
                      </div>
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-white tracking-tight pt-0.5">
                      {availableStock} pcs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-zinc-500">
                    Gudang: {warehouseStock} | Display: {displayStock}
                  </CardContent>
                </Card>

                {/* Stat 4: Total Revenue */}
                <Card className="bg-[#18181b] border-zinc-800/80">
                  <CardHeader className="pb-1.5">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs font-medium text-zinc-400">
                        Total Omzet
                      </CardDescription>
                      <div className="size-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300">
                        <IconReceiptTax className="size-3.5" />
                      </div>
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-white tracking-tight pt-0.5">
                      {totalRevenue}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-zinc-500">
                    Gross product sales
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs md:text-sm font-medium text-zinc-300">
                  Deskripsi Produk
                </span>
                <p className="text-sm text-zinc-400 leading-relaxed bg-[#18181b] p-3.5 rounded-xl border border-zinc-800">
                  {description}
                </p>
              </div>

              {/* Pricing breakdown */}
              {costPrice && (
                <div className="space-y-2">
                  <span className="text-xs md:text-sm font-medium text-zinc-300 flex items-center gap-1.5">
                    <IconCash className="size-4 text-emerald-400" />
                    <span>Struktur Finansial</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 text-xs">
                      <span className="text-zinc-500">Harga Jual</span>
                      <p className="font-semibold text-white font-mono text-sm mt-0.5">
                        {rawPrice}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 text-xs">
                      <span className="text-zinc-500">
                        Harga Modal (Estimasi)
                      </span>
                      <p className="font-semibold text-zinc-300 font-mono text-sm mt-0.5">
                        {costPrice}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Variants from system (if any) */}
              {variants.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs md:text-sm font-medium text-zinc-300">
                    Pilihan Varian
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {variants.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181b] border border-zinc-800 text-xs"
                      >
                        <span className="text-zinc-300 font-medium">
                          {v.option}: {v.value}
                        </span>
                        {v.price ? (
                          <span className="font-mono text-zinc-400">
                            +{formatIDR(v.price)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rincian Stok & Lokasi Card (Moved to Right Column) */}
          <Card className="bg-[#121215] border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <IconBuildingWarehouse className="size-4 text-zinc-400" />
                <span>Rincian Stok & Lokasi</span>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Pencatatan inventaris multi-lokasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181b] border border-zinc-800 text-xs">
                <span className="text-zinc-400">Stok Etalase / Kasir</span>
                <span className="font-semibold text-white font-mono text-sm">
                  {displayStock} pcs
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181b] border border-zinc-800 text-xs">
                <span className="text-zinc-400">Stok Gudang</span>
                <span className="font-semibold text-white font-mono text-sm">
                  {warehouseStock} pcs
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/80 text-xs">
                <span className="font-medium text-zinc-200">
                  Total Stok Keseluruhan
                </span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {availableStock} pcs
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Add-ons Terkait Card (Moved to Right Column) */}
          <Card className="bg-[#121215] border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <IconSparkles className="size-4 text-amber-400" />
                  <span>Add-ons Terkait</span>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs text-zinc-400 border-zinc-700"
                >
                  {addons.length} Terhubung
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Pilihan ekstra dan modifikasi dari database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addons.length === 0 ? (
                <div className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800 rounded-xl">
                  Tidak ada add-on yang dihubungkan ke produk ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181b] border border-zinc-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200">
                          {addon.name}
                        </span>
                        {addon.isActive !== false ? (
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-zinc-600" />
                        )}
                      </div>
                      <span className="font-mono text-zinc-400">
                        +
                        {typeof addon.price === "number"
                          ? formatIDR(addon.price)
                          : addon.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
