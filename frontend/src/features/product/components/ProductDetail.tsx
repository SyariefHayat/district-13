import * as React from "react";
import {
  IconPencil,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconCurrencyDollar,
  IconTruck,
  IconStack2,
  IconReceiptTax,
  IconShoppingCart,
  IconHeart,
  IconHeartFilled,
  IconArrowLeft,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface ProductDetailImage {
  id: string;
  url: string;
  alt?: string;
  label?: string;
}

export interface ProductDetailColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductDetailSpec {
  label: string;
  value: string;
}

export interface ProductDetailData {
  id?: string;
  name?: string;
  seller?: string;
  publishedDate?: string;
  sku?: string;
  price?: number | string;
  ordersCount?: number | string;
  availableStock?: number | string;
  totalRevenue?: number | string;
  description?: string;
  features?: string[];
  colors?: ProductDetailColor[];
  sizes?: string[];
  specifications?: ProductDetailSpec[];
  images?: ProductDetailImage[];
  isWishlisted?: boolean;
}

export interface ProductDetailProps {
  product?: ProductDetailData;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToCart?: (selected: { color?: string; size?: string }) => void;
  onToggleWishlist?: (isWishlisted: boolean) => void;
  onBack?: () => void;
  className?: string;
}

// Default images reference: Hoodie, T-Shirt, Sweatpants, Cap (from Main.png)
const DEFAULT_IMAGES: ProductDetailImage[] = [
  {
    id: "img-1",
    url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80",
    alt: "Acme Prism Hoodie - Grey",
    label: "Sweatshirt / Hoodie",
  },
  {
    id: "img-2",
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
    alt: "Mountain Graphic T-Shirt",
    label: "T-Shirt",
  },
  {
    id: "img-3",
    url: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80",
    alt: "Slim Fit Black Joggers",
    label: "Joggers",
  },
  {
    id: "img-4",
    url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80",
    alt: "Classic Red Baseball Cap",
    label: "Cap",
  },
];

const DEFAULT_COLORS: ProductDetailColor[] = [
  { id: "emerald", name: "Emerald Green", hex: "#00d26a" },
  { id: "periwinkle", name: "Periwinkle Blue", hex: "#6366f1" },
  { id: "purple", name: "Vibrant Purple", hex: "#a855f7" },
];

const DEFAULT_SIZES = ["SM", "MD", "LG", "XL", "XXL"];

const DEFAULT_SPECS: ProductDetailSpec[] = [
  { label: "Category", value: "T-Shirt" },
  { label: "Brand", value: "Tommy Hilfiger" },
  { label: "Color", value: "Purple" },
  { label: "Weight", value: "140 Gr" },
];

const DEFAULT_FEATURES = [
  "Industry-leading noise cancellation",
  "30-hour battery life",
  "Touch sensor controls",
  "Speak-to-chat technology",
];

export function ProductDetail({
  product,
  onEdit,
  onDelete,
  onAddToCart,
  onToggleWishlist,
  onBack,
  className,
}: ProductDetailProps) {
  // Merge defaults matching Main.png reference
  const name = product?.name ?? "Acme Prism T-Shirt";
  const seller = product?.seller ?? "Poetic Fashion";
  const publishedDate = product?.publishedDate ?? "20 Oct, 2024";
  const sku = product?.sku ?? "WH1000XM4";

  const price = product?.price ?? "$120.40";
  const ordersCount = product?.ordersCount ?? "250";
  const availableStock = product?.availableStock ?? "2,550";
  const totalRevenue = product?.totalRevenue ?? "$45,938";

  const description =
    product?.description ??
    "Tommy Hilfiger men striped pink sweatshirt. Crafted with cotton. Material composition is 100% organic cotton.";

  const features = product?.features ?? DEFAULT_FEATURES;
  const colors = product?.colors ?? DEFAULT_COLORS;
  const sizes = product?.sizes ?? DEFAULT_SIZES;
  const specifications = product?.specifications ?? DEFAULT_SPECS;
  const images = product?.images?.length ? product.images : DEFAULT_IMAGES;

  // Active states
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState<string>(
    colors[0]?.id ?? ""
  );
  const [selectedSize, setSelectedSize] = React.useState<string>("MD");
  const [isWishlisted, setIsWishlisted] = React.useState(
    product?.isWishlisted ?? false
  );
  const [isAddedToCart, setIsAddedToCart] = React.useState(false);
  const [imgErrorMap, setImgErrorMap] = React.useState<Record<string, boolean>>(
    {}
  );

  const activeImage = images[activeImageIndex] || images[0];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
    if (onAddToCart) {
      onAddToCart({ color: selectedColor, size: selectedSize });
    } else {
      toast.add({
        title: "Added to cart",
        description: `${name} (Size: ${selectedSize}) has been added.`,
      });
    }
  };

  const handleToggleWishlist = () => {
    const next = !isWishlisted;
    setIsWishlisted(next);
    if (onToggleWishlist) {
      onToggleWishlist(next);
    } else {
      toast.add({
        title: next ? "Added to wishlist" : "Removed from wishlist",
      });
    }
  };

  const handleImageError = (id: string) => {
    setImgErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      className={cn(
        "w-full rounded-3xl bg-[#0e1015] text-zinc-100 p-4 sm:p-6 lg:p-8 border border-zinc-800/80 shadow-2xl transition-all",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-zinc-800/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full"
                title="Go back"
              >
                <IconArrowLeft className="size-4" />
              </Button>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {name}
            </h1>
          </div>

          {/* Subtitle info row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="font-normal text-zinc-400">Seller :</span>
              <span className="font-medium text-zinc-200">{seller}</span>
            </div>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="font-normal text-zinc-400">Published :</span>
              <span className="font-medium text-zinc-200">{publishedDate}</span>
            </div>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="font-normal text-zinc-400">SKU :</span>
              <span className="font-mono text-zinc-200 tracking-wide uppercase">
                {sku}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Action Buttons: Edit and Delete */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <Button
            type="button"
            variant="default"
            onClick={onEdit}
            className="h-10 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-sm gap-2 shadow-sm transition-all"
          >
            <IconPencil className="size-4 stroke-[2]" />
            <span>Edit</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  aria-label="Delete product"
                  className="size-10 rounded-xl bg-[#671424] hover:bg-[#85182e] border border-red-900/60 text-red-200 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                >
                  <IconTrash className="size-4.5 stroke-[2]" />
                </button>
              }
            />
            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">
                  Delete {name}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  Are you sure you want to delete this product? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Grid: Left Gallery + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-6">
        {/* Left Column: Image Gallery (Span 5 on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Main Large Image Container */}
          <div className="relative group w-full aspect-square rounded-3xl bg-[#15171f] border border-zinc-800/80 overflow-hidden flex items-center justify-center p-6 sm:p-8 shadow-inner">
            {imgErrorMap[activeImage?.id] ? (
              <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                <IconStack2 className="size-16 stroke-1 text-zinc-600" />
                <span className="text-xs">
                  {activeImage?.label ?? "Product Image"}
                </span>
              </div>
            ) : (
              <img
                src={activeImage?.url}
                alt={activeImage?.alt ?? name}
                onError={() => handleImageError(activeImage?.id)}
                className="w-full h-full object-contain filter drop-shadow-2xl transition-all duration-300 group-hover:scale-105"
              />
            )}

            {/* Carousel Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-zinc-950/40 hover:bg-zinc-900/90 text-zinc-200 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                >
                  <IconChevronLeft className="size-6 stroke-[1.75]" />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-zinc-950/40 hover:bg-zinc-900/90 text-zinc-200 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                >
                  <IconChevronRight className="size-6 stroke-[1.75]" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Row */}
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => {
              const isActive = idx === activeImageIndex;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "aspect-square rounded-2xl bg-[#15171f] p-2 flex items-center justify-center overflow-hidden transition-all cursor-pointer relative",
                    isActive
                      ? "border-2 border-zinc-200 ring-2 ring-white/10 shadow-md scale-102"
                      : "border border-zinc-800/80 hover:border-zinc-600 opacity-70 hover:opacity-100"
                  )}
                  title={img.label ?? `View image ${idx + 1}`}
                >
                  {imgErrorMap[img.id] ? (
                    <div className="text-[10px] text-zinc-500 font-medium">
                      {img.label?.slice(0, 8) ?? `Img ${idx + 1}`}
                    </div>
                  ) : (
                    <img
                      src={img.url}
                      alt={img.alt ?? `Thumbnail ${idx + 1}`}
                      onError={() => handleImageError(img.id)}
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Stats Cards + Detailed Info & Specs (Span 7 on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Top 4 Metric / Stats Cards Row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Card 1: Price */}
            <div className="rounded-2xl bg-[#14161e] border border-zinc-800/80 p-4 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                  <IconCurrencyDollar className="size-4 stroke-[2]" />
                </div>
                <span className="text-xs font-medium text-zinc-400">Price</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {price}
              </div>
            </div>

            {/* Card 2: No. of Orders */}
            <div className="rounded-2xl bg-[#14161e] border border-zinc-800/80 p-4 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                  <IconTruck className="size-4 stroke-[2]" />
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  No. of Orders
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {ordersCount}
              </div>
            </div>

            {/* Card 3: Available Stocks */}
            <div className="rounded-2xl bg-[#14161e] border border-zinc-800/80 p-4 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                  <IconStack2 className="size-4 stroke-[2]" />
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  Available Stocks
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {availableStock}
              </div>
            </div>

            {/* Card 4: Total Revenue */}
            <div className="rounded-2xl bg-[#14161e] border border-zinc-800/80 p-4 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                  <IconReceiptTax className="size-4 stroke-[2]" />
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  Total Revenue
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {totalRevenue}
              </div>
            </div>
          </div>

          {/* Bottom Card: Description, Features, Options, & Specification Table */}
          <div className="rounded-3xl bg-[#14161e] border border-zinc-800/80 p-5 sm:p-6 lg:p-7 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Sub-Column: Description, Features, Colors, Sizes, Actions */}
              <div className="md:col-span-7 flex flex-col gap-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Description:
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Key Features */}
                {features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2.5">
                      Key Features:
                    </h3>
                    <ul className="space-y-1.5">
                      {features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-zinc-400 flex items-start gap-2.5"
                        >
                          <span className="size-1 rounded-full bg-zinc-500 mt-2 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Colors */}
                {colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2.5">
                      Colors:
                    </h3>
                    <div className="flex items-center gap-3">
                      {colors.map((color) => {
                        const isSelected = selectedColor === color.id;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => setSelectedColor(color.id)}
                            style={{ backgroundColor: color.hex }}
                            aria-label={`Select color ${color.name}`}
                            className={cn(
                              "size-7 rounded-full cursor-pointer transition-all flex items-center justify-center",
                              isSelected
                                ? "ring-2 ring-white ring-offset-2 ring-offset-[#14161e] scale-110 shadow-lg"
                                : "opacity-90 hover:opacity-100 hover:scale-105"
                            )}
                            title={color.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2.5">
                      Sizes:
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {sizes.map((size) => {
                        const isSelected = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              "size-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer",
                              isSelected
                                ? "border-2 border-white text-white bg-transparent shadow-sm"
                                : "border border-zinc-800 bg-[#1a1d26]/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions: Add to Card & Wishlist */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    className="h-11 px-6 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm gap-2 shadow-sm transition-all"
                  >
                    {isAddedToCart ? (
                      <>
                        <IconCheck className="size-4.5 stroke-[2.5] text-emerald-600" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <IconShoppingCart className="size-4.5 stroke-[2]" />
                        <span>Add to Card</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleToggleWishlist}
                    className={cn(
                      "h-11 px-5 rounded-xl border border-zinc-800 bg-[#1a1d26] text-zinc-200 font-medium text-sm gap-2 transition-all hover:bg-zinc-800",
                      isWishlisted && "text-rose-400 border-rose-500/40"
                    )}
                  >
                    {isWishlisted ? (
                      <IconHeartFilled className="size-4.5 text-rose-500" />
                    ) : (
                      <IconHeart className="size-4.5 stroke-[2]" />
                    )}
                    <span>Wishlist</span>
                  </Button>
                </div>
              </div>

              {/* Right Sub-Column: Specifications Table Card */}
              <div className="md:col-span-5 w-full">
                <div className="rounded-2xl border border-zinc-800/80 bg-[#111319]/80 overflow-hidden divide-y divide-zinc-800/80 shadow-sm">
                  {specifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className="px-5 py-4 flex items-center justify-between text-sm"
                    >
                      <span className="font-semibold text-zinc-200">
                        {spec.label}
                      </span>
                      <span className="text-zinc-400 font-normal">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
