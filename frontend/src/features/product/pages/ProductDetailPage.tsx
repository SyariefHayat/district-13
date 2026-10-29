import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  IconPencil,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useAuth } from "@/context/auth-context";
import {
  ProductDetail,
  type ProductDetailData,
} from "../components/ProductDetail";
import { useProductData } from "../hooks/useProductData";
import { formatIDR, getPresetImageForCategory } from "../data/productData";

interface BackendProductDetailResponse {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  images?: string[];
  price: string | number;
  costPrice?: string | number;
  chargeTax?: boolean;
  inStock?: boolean;
  status?: string;
  stock?: number;
  soldCount?: number;
  warehouseStock?: number;
  displayStock?: number;
  updatedAt?: string;
  variants?: Array<{
    id?: string;
    option?: string;
    value?: string;
    price?: number;
  }>;
  isActive: boolean;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
  categoryIsActive?: boolean;
  subCategoryId?: string;
  subCategoryName?: string;
  addons?: Array<{
    id: string;
    name: string;
    price: string | number;
    isActive: boolean;
  }>;
}

interface InventoryDashboardResponse {
  data?: Array<{
    id: string;
    productId: string;
    location: "WAREHOUSE" | "DISPLAY";
    stock: number;
    updatedAt: string;
  }>;
  totals?: {
    WAREHOUSE?: number;
    DISPLAY?: number;
  };
}

function ProductDetailSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Header bar skeleton */}
      <div className="flex items-start justify-between gap-4 pb-2">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64 md:w-80 rounded-lg" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </div>

      {/* 2-Column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Image Skeleton */}
        <div className="lg:col-span-5 self-start">
          <Skeleton className="w-full aspect-square rounded-2xl" />
        </div>

        {/* Right: Stats & Cards Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          {/* 4 KPI cards skeleton */}
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border shadow-xs">
                <CardHeader className="pb-1.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="size-6 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-28 rounded" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-3 w-20 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail card skeleton */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 space-y-2">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* Variants card skeleton */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-3 w-48 rounded" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          {/* Stock card skeleton */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, authorizedFetch } = useAuth();
  const { products, deleteProduct } = useProductData();

  const [backendDetail, setBackendDetail] =
    React.useState<BackendProductDetailResponse | null>(null);
  const [warehouseStockCount, setWarehouseStockCount] = React.useState<
    number | null
  >(null);
  const [displayStockCount, setDisplayStockCount] = React.useState<
    number | null
  >(null);
  const [lastUpdatedDate, setLastUpdatedDate] = React.useState<string | null>(
    null
  );
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(true);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  // Cached product from overview list
  const cachedProduct = React.useMemo(() => {
    if (!id || id === "demo") return null;
    return products.find((p) => p.id === id);
  }, [products, id]);

  // Fetch product from /products/:id and its real inventory breakdown from /inventory/dashboard
  const fetchSingleProduct = React.useCallback(async () => {
    if (!id || id === "demo") {
      setIsLoadingDetail(false);
      return;
    }

    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      // 1. Fetch main product details & addons
      const res = await authorizedFetch(`/products/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Produk tidak ditemukan di database.");
        }
        throw new Error(`Gagal memuat detail produk (${res.status})`);
      }
      const data: BackendProductDetailResponse = await res.json();
      setBackendDetail(data);

      // 2. Fetch inventory locations (Warehouse vs Display stock) if user has permission
      try {
        const invRes = await authorizedFetch(
          `/inventory/dashboard?productId=${id}`
        );
        if (invRes.ok) {
          const invData: InventoryDashboardResponse = await invRes.json();
          if (invData.totals) {
            setWarehouseStockCount(invData.totals.WAREHOUSE ?? 0);
            setDisplayStockCount(invData.totals.DISPLAY ?? 0);
          } else if (Array.isArray(invData.data)) {
            let wh = 0;
            let dp = 0;
            let latestTime = "";
            for (const item of invData.data) {
              if (item.location === "WAREHOUSE") wh += item.stock;
              if (item.location === "DISPLAY") dp += item.stock;
              if (item.updatedAt && item.updatedAt > latestTime) {
                latestTime = item.updatedAt;
              }
            }
            setWarehouseStockCount(wh);
            setDisplayStockCount(dp);
            if (latestTime) {
              setLastUpdatedDate(
                new Date(latestTime).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              );
            }
          }
        } else if (data.updatedAt) {
          setLastUpdatedDate(
            new Date(data.updatedAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          );
        }
      } catch {
        // Fallback to direct product response
        if (data.updatedAt) {
          setLastUpdatedDate(
            new Date(data.updatedAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          );
        }
      }
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoadingDetail(false);
    }
  }, [id, authorizedFetch]);

  React.useEffect(() => {
    void fetchSingleProduct();
  }, [fetchSingleProduct]);

  // Synthesize database fields for this specific product
  const detailData: ProductDetailData = React.useMemo(() => {
    if (!backendDetail && !cachedProduct) {
      // Demo / fallback state
      return {
        id: id || "demo-id",
        name: "Caffe Latte",
        seller: user?.username ? `@${user.username}` : "District 13 Store",
        publishedDate: "20 Oct, 2024",
        sku: "KOP-1001",
        barcode: "899123456789",
        price: formatIDR(28000),
        costPrice: formatIDR(16000),
        ordersCount: "520",
        availableStock: "85",
        warehouseStock: "50",
        displayStock: "35",
        totalRevenue: formatIDR(28000 * 520),
        category: "Coffee",
        subCategory: "Espresso Based",
        isActive: true,
        isAvailable: true,
        image: getPresetImageForCategory("Coffee"),
        description:
          "Minuman kopi susu dengan paduan espresso pilihan dan steamed fresh milk lembut berkualitas premium.",
        variants: [
          {
            id: "var-1",
            option: "Suhu / Penyajian",
            value: "Dingin / Ice",
            price: 2000,
          },
          {
            id: "var-2",
            option: "Porsi / Ukuran",
            value: "Large (16oz)",
            price: 4000,
          },
        ],
        addons: [
          {
            id: "add-1",
            name: "Extra Espresso Shot",
            price: 5000,
            isActive: true,
          },
          {
            id: "add-2",
            name: "Oat Milk Substitute",
            price: 8000,
            isActive: true,
          },
          { id: "add-3", name: "Caramel Syrup", price: 4000, isActive: true },
        ],
      };
    }

    const name = backendDetail?.name || cachedProduct?.name || "Produk";
    const category =
      backendDetail?.categoryName || cachedProduct?.category || "General";
    const subCategory = backendDetail?.subCategoryName || "";
    const priceNum = Number(backendDetail?.price ?? cachedProduct?.price ?? 0);
    const sku =
      backendDetail?.sku ||
      cachedProduct?.sku ||
      `${category.slice(0, 3).toUpperCase()}-${(id || "").slice(0, 4).toUpperCase()}`;

    const barcode =
      backendDetail?.barcode ||
      `899${(id || "").replace(/\D/g, "").slice(0, 9).padEnd(9, "0")}`;

    const description =
      backendDetail?.description ||
      cachedProduct?.description ||
      `Produk katalog ${category}${
        subCategory ? ` (${subCategory})` : ""
      } dengan pencatatan inventaris otomatis dan kesiapan transaksi di kasir.`;

    // Compute stock & sales from backend detail or inventory query
    const displayStockNum =
      displayStockCount !== null
        ? displayStockCount
        : Number(backendDetail?.displayStock ?? 0);

    const warehouseStockNum =
      warehouseStockCount !== null
        ? warehouseStockCount
        : backendDetail?.warehouseStock !== undefined
          ? Number(backendDetail.warehouseStock)
          : Math.max(0, Number(cachedProduct?.stock ?? 0) - displayStockNum);

    const totalStockNum =
      warehouseStockCount !== null && displayStockCount !== null
        ? warehouseStockNum + displayStockNum
        : backendDetail?.stock !== undefined
          ? Number(backendDetail.stock)
          : Number(cachedProduct?.stock ?? displayStockNum);

    const soldCountNum =
      backendDetail?.soldCount !== undefined
        ? Number(backendDetail.soldCount)
        : Number(cachedProduct?.soldCount ?? 0);

    const totalRevNum = priceNum * soldCountNum;

    const isActive = backendDetail?.isActive ?? cachedProduct?.isActive ?? true;
    const isAvailable =
      backendDetail?.isAvailable ?? cachedProduct?.isAvailable ?? true;

    const costPriceNum =
      backendDetail?.costPrice !== undefined && backendDetail.costPrice !== null
        ? Number(backendDetail.costPrice)
        : Math.round(priceNum * 0.6);

    const image =
      backendDetail?.images && backendDetail.images.length > 0
        ? backendDetail.images[0]
        : cachedProduct?.image || getPresetImageForCategory(category);

    return {
      id: id || "",
      name,
      seller: user?.username ? `@${user.username}` : "District 13 Store",
      publishedDate: lastUpdatedDate || "Aktif di Katalog",
      sku,
      barcode,
      price: formatIDR(priceNum),
      costPrice: formatIDR(costPriceNum),
      ordersCount: String(soldCountNum),
      availableStock: String(totalStockNum),
      warehouseStock: String(warehouseStockNum),
      displayStock: String(displayStockNum),
      totalRevenue: formatIDR(totalRevNum),
      category,
      categoryId: backendDetail?.categoryId,
      subCategory,
      subCategoryId: backendDetail?.subCategoryId,
      isActive,
      isAvailable,
      image,
      description,
      variants: backendDetail?.variants || [],
      addons:
        backendDetail?.addons?.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          isActive: a.isActive,
        })) || [],
    };
  }, [
    backendDetail,
    cachedProduct,
    id,
    user?.username,
    warehouseStockCount,
    displayStockCount,
    lastUpdatedDate,
  ]);

  const handleDelete = async () => {
    if (id && id !== "demo") {
      try {
        await deleteProduct(id);
        toast.add({
          title: "Produk berhasil dihapus",
          description: `${detailData.name} telah dihapus dari database.`,
        });
        navigate("/dashboard/products");
      } catch {
        toast.add({
          title: "Gagal menghapus produk",
          description: "Terjadi kesalahan saat menghapus data.",
        });
      }
    } else {
      toast.add({ title: "Produk demo telah dihapus" });
      navigate("/dashboard/products");
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/products/${id || "demo"}/edit`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-310 space-y-6">
        {/* Loading Skeleton State */}
        {isLoadingDetail && !cachedProduct ? (
          <ProductDetailSkeleton />
        ) : (
          <>
            {/* Header Bar */}
            <div className="flex items-start justify-between gap-4 pb-2">
              {/* Left: Title + Under it: added by, published, sku (pure text) */}
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {detailData.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      Added By :
                    </span>
                    <span className="text-muted-foreground font-normal">
                      {detailData.seller || "District 13 Store"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      Published :
                    </span>
                    <span className="text-muted-foreground font-normal">
                      {detailData.publishedDate || "20 Oct, 2024"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">SKU :</span>
                    <span className="font-mono text-muted-foreground uppercase tracking-wide">
                      {detailData.sku}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Button Edit with icon and beside it icon-only delete button */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleEdit}
                  className="h-9 px-3.5 rounded-lg gap-2 text-xs font-medium"
                >
                  <IconPencil className="size-4" />
                  <span>Edit</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Hapus produk"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    }
                  />
                  <AlertDialogContent className="bg-card border-border text-foreground">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">
                        Hapus Produk {detailData.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Apakah Anda yakin ingin menghapus produk ini dari
                        database? Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90 text-white"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Error State */}
            {detailError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconAlertCircle className="size-6 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{detailError}</p>
                    <p className="text-xs text-destructive/80 mt-0.5">
                      Pastikan ID produk benar atau kembali ke daftar produk.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchSingleProduct()}
                    className="gap-1.5"
                  >
                    <IconRefresh className="size-4" />
                    <span>Coba Lagi</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard/products")}
                  >
                    Kembali
                  </Button>
                </div>
              </div>
            )}

            {/* Main Product Detail View */}
            <ProductDetail product={detailData} />
          </>
        )}
      </div>
    </div>
  );
}
