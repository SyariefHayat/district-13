import * as React from "react";
import { useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconSparkles,
  IconPackage,
  IconTag,
  IconBarcode,
  IconPhoto,
  IconCup,
  IconCookie,
  IconShirt,
  IconTrendingUp,
  IconInfoCircle,
  IconCheck,
  IconExternalLink,
  IconLayersLinked,
} from "@tabler/icons-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import {
  PRODUCT_CATEGORIES,
  formatIDR,
  generateSkuForCategory,
  getPresetImageForCategory,
  coffeeSvg,
  pastrySvg,
  mealSvg,
  hoodieSvg,
  tshirtSvg,
  joggersSvg,
  capSvg,
  generalItemSvg,
  type ProductItem,
} from "../data/productData";
import {
  addProductSchema,
  type AddProductFormData,
} from "../schemas/productFormSchema";

const PRESET_ICONS = [
  { label: "Coffee", svg: coffeeSvg, icon: IconCup },
  { label: "Pastry", svg: pastrySvg, icon: IconCookie },
  { label: "Food", svg: mealSvg, icon: IconPackage },
  { label: "Hoodie", svg: hoodieSvg, icon: IconShirt },
  { label: "T-Shirt", svg: tshirtSvg, icon: IconShirt },
  { label: "Pants", svg: joggersSvg, icon: IconPackage },
  { label: "Cap", svg: capSvg, icon: IconPackage },
  { label: "General", svg: generalItemSvg, icon: IconPackage },
];

interface AddProductPageProps {
  onProductCreated?: (product: ProductItem) => void;
}

export default function AddProductPage({
  onProductCreated,
}: AddProductPageProps) {
  const navigate = useNavigate();
  const [showCustomUrl, setShowCustomUrl] = React.useState(false);

  const availableCategories = React.useMemo(
    () => PRODUCT_CATEGORIES.filter((cat) => cat !== "Semua Kategori"),
    []
  );

  const defaultCategory = availableCategories[0] || "Coffee";
  const defaultSku = React.useMemo(
    () => generateSkuForCategory(defaultCategory),
    [defaultCategory]
  );
  const defaultImage = React.useMemo(
    () => getPresetImageForCategory(defaultCategory),
    [defaultCategory]
  );

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      sku: defaultSku,
      barcode: "",
      category: defaultCategory,
      price: 0,
      costPrice: undefined,
      trackStock: true,
      stock: 10,
      minStock: 5,
      isAvailable: true,
      isActive: true,
      description: "",
      tags: "Menu Baru",
      image: defaultImage,
    },
    mode: "onBlur",
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const currentCategory = watch("category");
  const currentPrice = watch("price");
  const currentCostPrice = watch("costPrice");
  const currentImage = watch("image");
  const currentSku = watch("sku");
  const currentName = watch("name");
  const currentStock = watch("stock");
  const currentIsAvailable = watch("isAvailable");
  const currentIsActive = watch("isActive");
  const currentTrackStock = watch("trackStock");

  // Handle category change to auto-update image and suggest SKU
  const handleCategoryChange = (newCategory: string | null) => {
    if (!newCategory) return;
    setValue("category", newCategory, { shouldValidate: true });

    if (!showCustomUrl) {
      setValue("image", getPresetImageForCategory(newCategory));
    }

    if (!currentSku || currentSku.includes("-")) {
      setValue("sku", generateSkuForCategory(newCategory), {
        shouldValidate: true,
      });
    }
  };

  const handleGenerateSku = () => {
    const generated = generateSkuForCategory(currentCategory || "General");
    setValue("sku", generated, { shouldValidate: true, shouldDirty: true });
  };

  // Gross Margin live calculation
  const marginCalculation = React.useMemo(() => {
    const price = Number(currentPrice) || 0;
    const cost = Number(currentCostPrice) || 0;

    if (price <= 0 || cost <= 0) {
      return null;
    }

    const profit = price - cost;
    const marginPct = (profit / price) * 100;

    return {
      profit,
      marginPct: marginPct.toFixed(1),
      isHealthy: marginPct >= 30,
    };
  }, [currentPrice, currentCostPrice]);

  const onSubmit = (data: AddProductFormData) => {
    try {
      const createdItem: ProductItem = {
        id: `prod-${Date.now()}`,
        name: data.name.trim(),
        sku: data.sku.trim().toUpperCase(),
        category: data.category,
        price: Number(data.price),
        stock: Number(data.stock),
        isAvailable: data.isAvailable,
        isActive: data.isActive,
        soldCount: 0,
        rating: 5.0,
        image: data.image || getPresetImageForCategory(data.category),
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        description: data.description?.trim(),
      };

      if (onProductCreated) {
        onProductCreated(createdItem);
      }

      toast.add({
        title: "Produk Berhasil Dibuat",
        description: `"${data.name}" telah ditambahkan ke katalog produk.`,
        type: "success",
      });

      navigate("/dashboard/products");
    } catch (error) {
      toast.add({
        title: "Gagal Menyimpan",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan produk.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb & Page Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1.5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/dashboard");
                  }}
                >
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard/products"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/dashboard/products");
                  }}
                >
                  Katalog & Produk
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Tambah Produk Baru</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2 mt-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/products")}
              className="size-8"
              title="Kembali ke Daftar Produk"
            >
              <IconArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tambah Produk Baru
            </h1>
            <Badge variant="outline" className="text-xs ml-2 font-normal">
              Draf Baru
            </Badge>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/products")}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="gap-1.5"
          >
            <IconDeviceFloppy className="size-4" />
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Produk"}</span>
          </Button>
        </div>
      </div>

      {/* Main Form Content (2 Columns Grid) */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Form Core Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Informasi Produk */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IconPackage className="size-4" />
                  </div>
                  <div>
                    <CardTitle>Informasi Dasar Produk</CardTitle>
                    <CardDescription>
                      Detail utama nama, kategori, dan deskripsi produk menu
                      kasir.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nama Produk */}
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="product-name">
                          Nama Produk{" "}
                          <span className="text-destructive">*</span>
                        </FieldLabel>
                        {errors.name && (
                          <span className="text-xs text-destructive">
                            {errors.name.message}
                          </span>
                        )}
                      </div>
                      <Input
                        id="product-name"
                        placeholder="Contoh: Caramel Macchiato atau Vintage Graphic Tee"
                        autoFocus
                        {...field}
                      />
                      <FieldDescription className="text-xs">
                        Nama produk akan dicetak pada struk transaksi dan
                        ditampilkan di layar kasir.
                      </FieldDescription>
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kategori Dropdown */}
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor="product-category">
                            Kategori Produk{" "}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          {errors.category && (
                            <span className="text-xs text-destructive">
                              {errors.category.message}
                            </span>
                          )}
                        </div>
                        <Select
                          value={field.value}
                          onValueChange={handleCategoryChange}
                        >
                          <SelectTrigger
                            id="product-category"
                            className="w-full"
                          >
                            <SelectValue placeholder="Pilih kategori menu" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  {/* Tag / Label */}
                  <Controller
                    name="tags"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="product-tags">
                          Tag / Label Menu
                        </FieldLabel>
                        <Input
                          id="product-tags"
                          placeholder="Signature, Best Seller, Dingin"
                          {...field}
                        />
                      </Field>
                    )}
                  />
                </div>

                {/* Deskripsi Singkat */}
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="product-description">
                        Deskripsi & Keterangan Menu (Opsional)
                      </FieldLabel>
                      <Textarea
                        id="product-description"
                        rows={3}
                        placeholder="Tuliskan komposisi bahan, takaran, alergen, atau panduan penyajian untuk staf kasir dan barista..."
                        {...field}
                      />
                    </Field>
                  )}
                />
              </CardContent>
            </Card>

            {/* Card 2: Harga & Finansial */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <IconTrendingUp className="size-4" />
                    </div>
                    <div>
                      <CardTitle>Harga & Profitabilitas</CardTitle>
                      <CardDescription>
                        Atur harga jual ke konsumen dan pantau estimasi margin
                        laba kotor.
                      </CardDescription>
                    </div>
                  </div>

                  {marginCalculation && (
                    <Badge
                      variant="outline"
                      className={`gap-1.5 py-1 px-2.5 text-xs font-medium self-start sm:self-auto ${
                        marginCalculation.isHealthy
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                      }`}
                    >
                      <IconTrendingUp className="size-3.5" />
                      <span>Margin: {marginCalculation.marginPct}%</span>
                      <span className="text-muted-foreground">
                        (Profit: {formatIDR(marginCalculation.profit)})
                      </span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Harga Jual */}
                  <Controller
                    name="price"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor="product-price">
                            Harga Jual Kasir{" "}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          {errors.price && (
                            <span className="text-xs text-destructive">
                              {errors.price.message}
                            </span>
                          )}
                        </div>
                        <InputGroup>
                          <InputGroupAddon align="inline-start">
                            Rp
                          </InputGroupAddon>
                          <InputGroupInput
                            id="product-price"
                            type="number"
                            min="0"
                            step="500"
                            placeholder="0"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </InputGroup>
                        <FieldDescription className="text-xs">
                          {currentPrice > 0
                            ? `Format Kasir: ${formatIDR(Number(currentPrice))}`
                            : "Harga final yang dibayar oleh pelanggan"}
                        </FieldDescription>
                      </Field>
                    )}
                  />

                  {/* Harga Modal / HPP */}
                  <Controller
                    name="costPrice"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="product-cost-price">
                          Harga Modal / HPP (Opsional)
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupAddon align="inline-start">
                            Rp
                          </InputGroupAddon>
                          <InputGroupInput
                            id="product-cost-price"
                            type="number"
                            min="0"
                            step="500"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value)
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </InputGroup>
                        <FieldDescription className="text-xs">
                          {currentCostPrice && Number(currentCostPrice) > 0
                            ? `HPP: ${formatIDR(Number(currentCostPrice))}`
                            : "Biaya bahan baku per porsi/unit"}
                        </FieldDescription>
                      </Field>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Inventaris & Manajemen Stok */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <IconBarcode className="size-4" />
                  </div>
                  <div>
                    <CardTitle>Inventaris & Stok</CardTitle>
                    <CardDescription>
                      Kelola identitas SKU, kode barcode, dan jumlah stok barang
                      siap jual.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SKU with Auto-Generator */}
                  <Controller
                    name="sku"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor="product-sku">
                            Kode SKU <span className="text-destructive">*</span>
                          </FieldLabel>
                          {errors.sku && (
                            <span className="text-xs text-destructive">
                              {errors.sku.message}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            id="product-sku"
                            placeholder="Contoh: CFE-1029"
                            className="font-mono uppercase text-xs tracking-wider"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleGenerateSku}
                            title="Generate SKU Otomatis"
                            className="shrink-0 size-8"
                          >
                            <IconSparkles className="size-4 text-amber-500" />
                          </Button>
                        </div>
                      </Field>
                    )}
                  />

                  {/* Barcode EAN */}
                  <Controller
                    name="barcode"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="product-barcode">
                          Barcode Scanner (Opsional)
                        </FieldLabel>
                        <Input
                          id="product-barcode"
                          placeholder="Scan atau ketik kode barcode"
                          className="font-mono text-xs"
                          {...field}
                        />
                      </Field>
                    )}
                  />
                </div>

                {/* Track Stock Toggle */}
                <Controller
                  name="trackStock"
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-xs font-medium text-foreground">
                        Lacak dan kurangi stok otomatis saat transaksi berhasil
                      </span>
                    </label>
                  )}
                />

                {currentTrackStock && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                    {/* Stok Awal */}
                    <Controller
                      name="stock"
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor="product-stock">
                            Stok Awal Siap Jual{" "}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="product-stock"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="10"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                          <FieldDescription className="text-xs">
                            {Number(field.value) === 0
                              ? "Item langsung ditandai 'Habis'"
                              : `${field.value} unit tersedia`}
                          </FieldDescription>
                        </Field>
                      )}
                    />

                    {/* Min Stock Alert */}
                    <Controller
                      name="minStock"
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor="product-min-stock">
                            Batas Peringatan Stok Menipis
                          </FieldLabel>
                          <Input
                            id="product-min-stock"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="5"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                          <FieldDescription className="text-xs">
                            Peringatan notifikasi saat stok ≤ {field.value || 5}{" "}
                            unit
                          </FieldDescription>
                        </Field>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 4: Add-ons & Modifiers Quick Banner */}
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IconLayersLinked className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Varian & Modifikasi Produk (Add-ons)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kelola topping tambahan, varian ukuran cup, atau opsi gula
                      di menu Manajemen Add-on.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/addons")}
                  className="shrink-0 gap-1.5"
                >
                  <span>Atur Add-ons</span>
                  <IconExternalLink className="size-3.5 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT 1 COLUMN: Media & POS Preview & Status */}
          <div className="space-y-6">
            {/* Card: Gambar & Ikon Produk */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconPhoto className="size-4 text-primary" />
                    <CardTitle className="text-sm">Ikon & Gambar</CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-muted-foreground"
                    onClick={() => setShowCustomUrl(!showCustomUrl)}
                  >
                    {showCustomUrl ? "Gunakan Preset" : "Custom URL"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Visual Thumbnail Preview */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border/70 bg-muted/30">
                  <div className="size-20 rounded-xl border border-border/80 bg-background p-1.5 flex items-center justify-center shadow-xs overflow-hidden">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt="Product preview"
                        className="size-full rounded-lg object-contain"
                      />
                    ) : (
                      <IconPhoto className="size-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-2 font-medium">
                    Ikon Tampilan Menu
                  </span>
                </div>

                {!showCustomUrl ? (
                  <div>
                    <span className="text-xs font-medium text-foreground block mb-2">
                      Pilih template ikon kategori:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_ICONS.map((preset) => {
                        const isSelected = currentImage === preset.svg;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setValue("image", preset.svg)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer text-left ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                                : "border-border/60 bg-card hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            <img
                              src={preset.svg}
                              alt={preset.label}
                              className="size-4 rounded-xs shrink-0"
                            />
                            <span className="truncate">{preset.label}</span>
                            {isSelected && (
                              <IconCheck className="size-3.5 ml-auto shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Controller
                      name="image"
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor="image-url">
                            URL Gambar
                          </FieldLabel>
                          <Input
                            id="image-url"
                            placeholder="https://images.unsplash.com/..."
                            {...field}
                          />
                          <FieldDescription className="text-[11px]">
                            Masukkan tautan gambar CDN atau hosting.
                          </FieldDescription>
                        </Field>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card: Status & Visibilitas Kasir */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IconTag className="size-4 text-primary" />
                  <CardTitle className="text-sm">
                    Status & Ketersediaan
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Tersedia di Kasir */}
                <Controller
                  name="isAvailable"
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors cursor-pointer select-none">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-foreground">
                          Stok Tersedia di Kasir
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Item siap dipesan. Jika dinonaktifkan, item ditandai
                          Habis.
                        </span>
                      </div>
                    </label>
                  )}
                />

                {/* Status Publikasi Aktif */}
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors cursor-pointer select-none">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-foreground">
                          Publikasi Aktif
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Produk aktif dalam sistem kasir dan laporan
                          inventaris.
                        </span>
                      </div>
                    </label>
                  )}
                />
              </CardContent>
            </Card>

            {/* Card: Live POS Terminal Card Preview */}
            <Card className="bg-gradient-to-b from-card to-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <IconInfoCircle className="size-3.5" />
                  <span>Pratinjau Kartu POS Kasir</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-background shadow-xs">
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
                    <img
                      src={currentImage || generalItemSvg}
                      alt="Thumbnail"
                      className="size-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {currentSku || "SKU-0000"}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {currentCategory}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {currentName || "Nama Produk Baru"}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-primary">
                        {currentPrice > 0
                          ? formatIDR(Number(currentPrice))
                          : "Rp 0"}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          currentIsAvailable && Number(currentStock) > 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {currentIsAvailable && Number(currentStock) > 0
                          ? `${currentStock} pcs`
                          : "Habis"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Floating Bar */}
        <div className="sticky bottom-4 z-20 mt-8 flex items-center justify-between rounded-xl border border-border/70 bg-card/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                currentIsActive ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              Status:{" "}
              <strong className="text-foreground">
                {currentIsActive ? "Aktif" : "Non-Aktif (Draf)"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/products")}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-1.5 shadow-xs"
            >
              <IconDeviceFloppy className="size-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Produk"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
