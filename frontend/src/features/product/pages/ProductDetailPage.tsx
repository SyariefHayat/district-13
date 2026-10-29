import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  IconPencil,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  price: string | number;
  isActive: boolean;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
  categoryIsActive?: boolean;
  subCategoryId?: string;
  subCategoryName?: string;
  displayStock?: number;
  addons?: Array<{
    id: string;
    name: string;
    price: string | number;
    isActive: boolean;
  }>;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authorizedFetch } = useAuth();
  const { products, deleteProduct } = useProductData();

  const [backendDetail, setBackendDetail] =
    React.useState<BackendProductDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(true);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  // Cached product from overview list
  const cachedProduct = React.useMemo(() => {
    if (!id || id === "demo") return null;
    return products.find((p) => p.id === id);
  }, [products, id]);

  // Fetch product from /products/:id
  const fetchSingleProduct = React.useCallback(async () => {
    if (!id || id === "demo") {
      setIsLoadingDetail(false);
      return;
    }

    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const res = await authorizedFetch(`/products/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Produk tidak ditemukan di database.");
        }
        throw new Error(`Gagal memuat detail produk (${res.status})`);
      }
      const data: BackendProductDetailResponse = await res.json();
      setBackendDetail(data);
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
        seller: "District 13 Store",
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
      cachedProduct?.sku || `PRD-${(id || "").slice(0, 4).toUpperCase()}`;

    const totalStockNum = Number(cachedProduct?.stock ?? 0);
    const displayStockNum = Number(backendDetail?.displayStock ?? 0);
    const warehouseStockNum = Math.max(0, totalStockNum - displayStockNum);
    const soldCountNum = Number(cachedProduct?.soldCount ?? 0);
    const totalRevNum = priceNum * soldCountNum;

    const isActive = backendDetail?.isActive ?? cachedProduct?.isActive ?? true;
    const isAvailable =
      backendDetail?.isAvailable ?? cachedProduct?.isAvailable ?? true;

    const image = cachedProduct?.image || getPresetImageForCategory(category);

    return {
      id: id || "",
      name,
      seller: "District 13 Store",
      publishedDate: "20 Oct, 2024",
      sku,
      barcode: `899${(id || "").replace(/\D/g, "").slice(0, 9).padEnd(9, "0")}`,
      price: formatIDR(priceNum),
      costPrice: formatIDR(Math.round(priceNum * 0.6)),
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
      description:
        cachedProduct?.description ||
        `Produk katalog ${category}${
          subCategory ? ` (${subCategory})` : ""
        } dengan pencatatan inventaris otomatis dan kesiapan transaksi di kasir.`,
      addons:
        backendDetail?.addons?.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          isActive: a.isActive,
        })) || [],
    };
  }, [backendDetail, cachedProduct, id]);

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
    navigate(`/dashboard/products/new?edit=${id || "demo"}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-310 space-y-6">
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
                    Apakah Anda yakin ingin menghapus produk ini dari database?
                    Tindakan ini tidak dapat dibatalkan.
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

        {/* Loading Spinner State */}
        {isLoadingDetail && !cachedProduct && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner className="size-8 text-white" />
            <span className="text-sm text-zinc-400">
              Memuat data produk dari database...
            </span>
          </div>
        )}

        {/* Error State */}
        {detailError && !cachedProduct && !isLoadingDetail && (
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
        {(!isLoadingDetail || cachedProduct || backendDetail) && (
          <ProductDetail product={detailData} />
        )}
      </div>
    </div>
  );
}
