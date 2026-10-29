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
    <div className={cn("w-full space-y-6 text-foreground", className)}>
      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sticky Product Image (5 cols) - Just the Image */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 self-start">
          <div className="w-full aspect-square rounded-2xl bg-card border border-border overflow-hidden flex items-center justify-center p-6 sm:p-8 shadow-xs">
            {imgError ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                <IconStack2 className="size-16 stroke-1 text-muted-foreground/60" />
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
        </div>

        {/* Right Column: ProductStats and DetailProduct Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ProductStats Grid (no big container around it) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Stat 1: Price */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1.5">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-muted-foreground">
                    Harga Jual
                  </CardDescription>
                  <div className="size-6 rounded-md bg-muted flex items-center justify-center text-foreground">
                    <IconCurrencyDollar className="size-3.5" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight pt-0.5 text-foreground">
                  {rawPrice}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[11px] text-muted-foreground">
                Katalog aktif
              </CardContent>
            </Card>

            {/* Stat 2: Orders Count */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1.5">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-muted-foreground">
                    Total Terjual
                  </CardDescription>
                  <div className="size-6 rounded-md bg-muted flex items-center justify-center text-foreground">
                    <IconTruck className="size-3.5" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight pt-0.5 text-foreground">
                  {ordersCount} pcs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[11px] text-muted-foreground">
                Transaksi selesai
              </CardContent>
            </Card>

            {/* Stat 3: Available Stock */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1.5">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-muted-foreground">
                    Stok Total
                  </CardDescription>
                  <div className="size-6 rounded-md bg-muted flex items-center justify-center text-foreground">
                    <IconStack2 className="size-3.5" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight pt-0.5 text-foreground">
                  {availableStock} pcs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[11px] text-muted-foreground">
                Gudang: {warehouseStock} | Display: {displayStock}
              </CardContent>
            </Card>

            {/* Stat 4: Total Revenue */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1.5">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-muted-foreground">
                    Total Omzet
                  </CardDescription>
                  <div className="size-6 rounded-md bg-muted flex items-center justify-center text-foreground">
                    <IconReceiptTax className="size-3.5" />
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight pt-0.5 text-foreground">
                  {totalRevenue}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[11px] text-muted-foreground">
                Gross product sales
              </CardContent>
            </Card>
          </div>

          {/* DetailProduct Card: Description, Pricing Breakdown, Variants */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Detail Produk
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Spesifikasi dan informasi umum produk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs md:text-sm font-medium text-foreground">
                  Deskripsi Produk
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 p-3.5 rounded-xl border border-border">
                  {description}
                </p>
              </div>

              {/* Pricing breakdown */}
              {costPrice && (
                <div className="space-y-2">
                  <span className="text-xs md:text-sm font-medium text-foreground flex items-center gap-1.5">
                    <IconCash className="size-4 text-emerald-500" />
                    <span>Struktur Finansial</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                      <span className="text-muted-foreground">Harga Jual</span>
                      <p className="font-semibold text-foreground font-mono text-sm mt-0.5">
                        {rawPrice}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                      <span className="text-muted-foreground">
                        Harga Modal (Estimasi)
                      </span>
                      <p className="font-semibold text-foreground font-mono text-sm mt-0.5">
                        {costPrice}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Variants from system (if any) */}
              {variants.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs md:text-sm font-medium text-foreground">
                    Pilihan Varian
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {variants.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs"
                      >
                        <span className="text-foreground font-medium">
                          {v.option}: {v.value}
                        </span>
                        {v.price ? (
                          <span className="font-mono text-muted-foreground">
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

          {/* Rincian Stok & Lokasi Card */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconBuildingWarehouse className="size-4 text-muted-foreground" />
                <span>Rincian Stok & Lokasi</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pencatatan inventaris multi-lokasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground">
                  Stok Etalase / Kasir
                </span>
                <span className="font-semibold text-foreground font-mono text-sm">
                  {displayStock} pcs
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground">Stok Gudang</span>
                <span className="font-semibold text-foreground font-mono text-sm">
                  {warehouseStock} pcs
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/70 border border-border text-xs">
                <span className="font-medium text-foreground">
                  Total Stok Keseluruhan
                </span>
                <span className="font-bold text-emerald-500 font-mono text-sm">
                  {availableStock} pcs
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Add-ons Terkait Card */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <IconSparkles className="size-4 text-amber-500" />
                  <span>Add-ons Terkait</span>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground border-border"
                >
                  {addons.length} Terhubung
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Pilihan ekstra dan modifikasi dari database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addons.length === 0 ? (
                <div className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-xl">
                  Tidak ada add-on yang dihubungkan ke produk ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {addon.name}
                        </span>
                        {addon.isActive !== false ? (
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                      <span className="font-mono text-muted-foreground">
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
