import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { FieldErrors } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconChevronLeft,
  IconChevronDown,
  IconCheck,
} from "@tabler/icons-react";

import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import {
  getPresetImageForCategory,
  generateSkuForCategory,
  type ProductItem,
} from "../data/productData";
import type { BackendCategory } from "../hooks/useProductData";
import {
  addProductSchema,
  type AddProductFormData,
} from "../schemas/productFormSchema";
import {
  DetailProduct,
  ProductImage,
  ProductVariant,
  ProductPrice,
  ProductStock,
  ProductStatus,
  ProductCategory,
  ProductAddon,
  type BackendAddon,
} from "../components/form";
import { Button } from "@/components/ui/button";

export interface BackendSubcategory {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
}

const DEFAULT_CATEGORY_OPTIONS = [
  { id: "c1b07384-d113-4c92-a1f9-4d6d03d00101", name: "Kopi" },
  { id: "c1b07384-d113-4c92-a1f9-4d6d03d00102", name: "Minuman Sachet" },
  { id: "c1b07384-d113-4c92-a1f9-4d6d03d00103", name: "Makanan" },
  { id: "c1b07384-d113-4c92-a1f9-4d6d03d00104", name: "Gorengan & Snack" },
  {
    id: "c1b07384-d113-4c92-a1f9-4d6d03d00105",
    name: "Minuman Dingin & Kaleng",
  },
];

const EMPTY_FORM_VALUES: AddProductFormData = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  images: [],
  price: 0,
  costPrice: undefined,
  chargeTax: false,
  inStock: true,
  warehouseStock: 0,
  displayStock: 0,
  status: "published",
  category: "",
  subCategory: "",
  variants: [],
  addonIds: [],
};

export interface EditPageProps {
  initialValues?: Partial<AddProductFormData>;
  productId?: string;
  onProductUpdated?: (product: ProductItem) => void;
}

export default function EditPage({
  initialValues,
  productId: propProductId,
  onProductUpdated,
}: EditPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { authorizedFetch } = useAuth();

  const [resolvedProductId, setResolvedProductId] = React.useState<
    string | null
  >(
    propProductId ||
      params.id ||
      searchParams.get("edit") ||
      searchParams.get("id") ||
      null
  );

  const [backendCategories, setBackendCategories] = React.useState<
    BackendCategory[]
  >([]);
  const [subCategories, setSubCategories] = React.useState<
    BackendSubcategory[]
  >([]);
  const [isLoadingSubCategories, setIsLoadingSubCategories] =
    React.useState(false);
  const [isDeletingSubCategory, setIsDeletingSubCategory] =
    React.useState(false);
  const [addons, setAddons] = React.useState<BackendAddon[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState<
    "draft" | "published" | null
  >(null);
  const isSaving = savingStatus !== null;
  const [isDeletingCategory, setIsDeletingCategory] = React.useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);

  const categoriesList = React.useMemo(() => {
    if (backendCategories.length > 0) {
      return backendCategories.map((c) => ({
        id: c.id,
        name: c.name,
      }));
    }
    return DEFAULT_CATEGORY_OPTIONS;
  }, [backendCategories]);

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      ...EMPTY_FORM_VALUES,
      ...initialValues,
    },
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentCategory = watch("category");
  const currentSubCategory = watch("subCategory");
  const currentImages = watch("images");
  const currentStatus = watch("status");
  const currentPrice = watch("price") || 0;
  const currentCostPrice = watch("costPrice");
  const currentChargeTax = watch("chargeTax");
  const currentWarehouseStock = watch("warehouseStock") || 0;
  const currentDisplayStock = watch("displayStock") || 0;
  const currentAddonIds = watch("addonIds") || [];

  // If no ID is provided, automatically find the first real product from backend
  React.useEffect(() => {
    const urlId =
      propProductId ||
      params.id ||
      searchParams.get("edit") ||
      searchParams.get("id");
    if (urlId) {
      setResolvedProductId(urlId);
      return;
    }

    let isMounted = true;
    async function fetchFirstProduct() {
      try {
        const res = await authorizedFetch("/products?page=1&limit=1");
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || [];
          if (isMounted && list.length > 0 && list[0].id) {
            setResolvedProductId(list[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not fetch first product:", err);
      }
    }

    void fetchFirstProduct();
    return () => {
      isMounted = false;
    };
  }, [propProductId, params.id, searchParams, authorizedFetch]);

  // 1. Load real categories from backend API
  React.useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await authorizedFetch("/categories");
        if (res.ok) {
          const data = await res.json();
          const list: BackendCategory[] = Array.isArray(data)
            ? data
            : data.data || [];
          const activeList = list.filter((c) => c.isActive);
          if (isMounted && activeList.length > 0) {
            setBackendCategories(activeList);
          }
        }
      } catch (err) {
        console.warn("Could not load backend categories:", err);
      }
    }
    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, [authorizedFetch]);

  // 2. Load real addons from backend API
  React.useEffect(() => {
    let isMounted = true;
    async function loadAddons() {
      setIsLoadingAddons(true);
      try {
        const res = await authorizedFetch("/addons");
        if (res.ok) {
          const data = await res.json();
          const list: BackendAddon[] = Array.isArray(data)
            ? data
            : data.data || [];
          if (isMounted) {
            setAddons(list.filter((a) => a.isActive));
          }
        }
      } catch (err) {
        console.warn("Could not load backend addons:", err);
      } finally {
        if (isMounted) {
          setIsLoadingAddons(false);
        }
      }
    }
    void loadAddons();
    return () => {
      isMounted = false;
    };
  }, [authorizedFetch]);

  // 3. Load real product data from backend API
  React.useEffect(() => {
    if (!resolvedProductId || resolvedProductId === "demo") return;

    let isMounted = true;
    async function loadProductData() {
      setIsLoadingProduct(true);
      try {
        const res = await authorizedFetch(`/products/${resolvedProductId}`);
        if (res.ok) {
          const product = await res.json();

          // Fetch real inventory counts from /inventory/dashboard
          let whStock = 0;
          let dpStock = 0;
          try {
            const invRes = await authorizedFetch(
              `/inventory/dashboard?productId=${resolvedProductId}`
            );
            if (invRes.ok) {
              const invData = await invRes.json();
              if (invData.totals) {
                whStock = invData.totals.WAREHOUSE ?? 0;
                dpStock = invData.totals.DISPLAY ?? 0;
              } else if (Array.isArray(invData.data)) {
                let wh = 0;
                let dp = 0;
                for (const item of invData.data) {
                  if (item.location === "WAREHOUSE") wh += item.stock;
                  if (item.location === "DISPLAY") dp += item.stock;
                }
                whStock = wh;
                dpStock = dp;
              }
            }
          } catch {
            // fallback
          }

          if (isMounted) {
            const resolvedPrice = Number(product.price) || 0;
            const categoryName = product.categoryName || "";
            const subCategoryName = product.subCategoryName || "";
            const addonIds = Array.isArray(product.addons)
              ? product.addons.map((a: { id: string }) => a.id)
              : [];

            // Compute SKU, Barcode, and Description consistently with product catalog
            const derivedSku =
              product.sku ||
              `${(categoryName || "PRD").slice(0, 3).toUpperCase()}-${(resolvedProductId || "").replace(/-/g, "").slice(0, 4).toUpperCase()}`;

            const derivedBarcode =
              product.barcode ||
              `899${(resolvedProductId || "").replace(/\D/g, "").slice(0, 9).padEnd(9, "0")}`;

            const derivedDescription =
              product.description ||
              `Produk katalog ${product.name} dalam kategori ${categoryName || "Umum"}${
                subCategoryName ? ` (${subCategoryName})` : ""
              } dengan pencatatan inventaris otomatis dan kesiapan transaksi di kasir.`;

            reset({
              name: product.name || "",
              sku: derivedSku,
              barcode: derivedBarcode,
              description: derivedDescription,
              images:
                Array.isArray(product.images) && product.images.length > 0
                  ? product.images
                  : categoryName
                    ? [getPresetImageForCategory(categoryName)]
                    : [],
              price: resolvedPrice,
              costPrice:
                product.costPrice !== undefined && product.costPrice !== null
                  ? Number(product.costPrice)
                  : Math.round(resolvedPrice * 0.6),
              chargeTax: product.chargeTax ?? false,
              inStock: product.inStock ?? Boolean(product.isAvailable),
              warehouseStock: whStock,
              displayStock: dpStock,
              status:
                product.status || (product.isActive ? "published" : "draft"),
              category: product.categoryId || "",
              subCategory: product.subCategoryId || "",
              variants: Array.isArray(product.variants) ? product.variants : [],
              addonIds,
              ...initialValues,
            });
          }
        }
      } catch (err) {
        console.warn("Could not load product details:", err);
      } finally {
        if (isMounted) {
          setIsLoadingProduct(false);
        }
      }
    }

    void loadProductData();
    return () => {
      isMounted = false;
    };
  }, [resolvedProductId, authorizedFetch, reset, initialValues]);

  // 4. Load subcategories whenever selected category changes
  React.useEffect(() => {
    let isMounted = true;
    async function loadSubcategories() {
      if (!currentCategory) {
        setSubCategories([]);
        return;
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const targetCatId = uuidRegex.test(currentCategory)
        ? currentCategory
        : backendCategories.find(
            (c) => c.name.toLowerCase() === currentCategory.toLowerCase()
          )?.id;

      if (!targetCatId) {
        setSubCategories([]);
        return;
      }

      setIsLoadingSubCategories(true);
      try {
        const res = await authorizedFetch(
          `/categories/${targetCatId}/subcategories`
        );
        if (res.ok) {
          const data = await res.json();
          const list: BackendSubcategory[] = Array.isArray(data)
            ? data
            : data.data || [];
          if (isMounted) {
            setSubCategories(list.filter((s) => s.isActive));
          }
        }
      } catch (err) {
        console.warn("Could not load backend subcategories:", err);
      } finally {
        if (isMounted) {
          setIsLoadingSubCategories(false);
        }
      }
    }

    void loadSubcategories();
    return () => {
      isMounted = false;
    };
  }, [authorizedFetch, currentCategory, backendCategories]);

  const selectedCategory = categoriesList.find(
    (c) => c.id === currentCategory || c.name === currentCategory
  );
  const selectedCategoryName = selectedCategory?.name || "";

  const handleCategoryChange = (val: string | null) => {
    if (!val) {
      setValue("category", "", { shouldValidate: true });
      setValue("subCategory", "");
      setSubCategories([]);
      return;
    }
    setValue("category", val, { shouldValidate: true });
    setValue("subCategory", "");
  };

  const handleAddCategory = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    try {
      const res = await authorizedFetch("/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const createdCat = (await res.json()) as BackendCategory;
        setBackendCategories((prev) => [...prev, createdCat]);
        setValue("category", createdCat.id, { shouldValidate: true });
        setValue("subCategory", "");
        setSubCategories([]);
        toast.add({
          title: "Kategori Berhasil Dibuat",
          description: `Kategori "${trimmed}" berhasil ditambahkan.`,
          type: "success",
        });
        return true;
      } else {
        const body = await res.json().catch(() => ({}));
        toast.add({
          title: "Gagal Membuat Kategori",
          description:
            typeof body.message === "string"
              ? body.message
              : "Tidak dapat membuat kategori di server.",
          type: "error",
        });
        return false;
      }
    } catch {
      setValue("category", trimmed, { shouldValidate: true });
      setValue("subCategory", "");
      setSubCategories([]);
      return true;
    }
  };

  const handleAddSubCategory = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    if (!currentCategory) {
      toast.add({
        title: "Pilih Kategori",
        description:
          "Silakan pilih kategori terlebih dahulu sebelum menambah sub-kategori.",
        type: "error",
      });
      return false;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let targetCatId = uuidRegex.test(currentCategory)
      ? currentCategory
      : backendCategories.find(
          (c) => c.name.toLowerCase() === currentCategory.toLowerCase()
        )?.id;

    if (!targetCatId) {
      toast.add({
        title: "Kategori Belum Tersimpan",
        description: "Silakan pilih kategori yang valid terlebih dahulu.",
        type: "error",
      });
      return false;
    }

    try {
      const res = await authorizedFetch(
        `/categories/${targetCatId}/subcategories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        }
      );

      if (res.ok) {
        const createdSub = (await res.json()) as BackendSubcategory;
        setSubCategories((prev) => {
          const filtered = prev.filter((s) => s.id !== createdSub.id);
          return [...filtered, createdSub].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        });
        setValue("subCategory", createdSub.id, { shouldValidate: true });
        toast.add({
          title: "Sub-kategori Berhasil Dibuat",
          description: `Sub-kategori "${trimmed}" berhasil ditambahkan dan disimpan ke database.`,
          type: "success",
        });
        return true;
      } else {
        const body = await res.json().catch(() => ({}));
        toast.add({
          title: "Gagal Membuat Sub-kategori",
          description:
            typeof body.message === "string"
              ? body.message
              : "Tidak dapat membuat sub-kategori di server.",
          type: "error",
        });
        return false;
      }
    } catch {
      toast.add({
        title: "Gagal Membuat Sub-kategori",
        description:
          "Terjadi kesalahan jaringan saat menambahkan sub-kategori.",
        type: "error",
      });
      return false;
    }
  };

  const handleDeleteCategory = async () => {
    const targetCategory = categoriesList.find(
      (c) => c.id === currentCategory || c.name === currentCategory
    );
    if (!targetCategory) return;

    const isBackendCat = backendCategories.some(
      (c) => c.id === targetCategory.id
    );

    if (isBackendCat) {
      setIsDeletingCategory(true);
      try {
        const res = await authorizedFetch(`/categories/${targetCategory.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const remaining = backendCategories.filter(
            (c) => c.id !== targetCategory.id
          );
          setBackendCategories(remaining);
          const nextCat = remaining[0];
          if (nextCat) {
            setValue("category", nextCat.id, { shouldValidate: true });
            setValue("subCategory", "");
          } else {
            setValue("category", "", { shouldValidate: true });
            setValue("subCategory", "");
            setSubCategories([]);
          }
          toast.add({
            title: "Kategori Berhasil Dihapus",
            description: `Kategori "${targetCategory.name}" berhasil dihapus.`,
            type: "success",
          });
        } else {
          const body = await res.json().catch(() => ({}));
          toast.add({
            title: "Gagal Menghapus Kategori",
            description:
              typeof body.message === "string"
                ? body.message
                : "Kategori tidak dapat dihapus (mungkin masih terdapat produk aktif).",
            type: "error",
          });
        }
      } catch {
        toast.add({
          title: "Gagal Menghapus Kategori",
          description: "Terjadi kesalahan jaringan saat menghapus kategori.",
          type: "error",
        });
      } finally {
        setIsDeletingCategory(false);
      }
    } else {
      const remainingDefaults = categoriesList.filter(
        (c) => c.id !== targetCategory.id
      );
      const nextCat = remainingDefaults[0];
      if (nextCat) {
        setValue("category", nextCat.id, { shouldValidate: true });
        setValue("subCategory", "");
      } else {
        setValue("category", "", { shouldValidate: true });
        setValue("subCategory", "");
        setSubCategories([]);
      }
      toast.add({
        title: "Kategori Berhasil Dihapus",
        description: `Kategori "${targetCategory.name}" berhasil dihapus.`,
        type: "success",
      });
    }
  };

  const handleDeleteSubCategory = async (): Promise<boolean> => {
    if (!currentSubCategory) return false;

    const targetSub = subCategories.find(
      (s) => s.id === currentSubCategory || s.name === currentSubCategory
    );
    if (!targetSub) return false;

    setIsDeletingSubCategory(true);
    try {
      const res = await authorizedFetch(
        `/categories/subcategories/${targetSub.id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setSubCategories((prev) => prev.filter((s) => s.id !== targetSub.id));
        setValue("subCategory", "");
        toast.add({
          title: "Sub-kategori Berhasil Dihapus",
          description: `Sub-kategori "${targetSub.name}" telah dihapus.`,
          type: "success",
        });
        return true;
      } else {
        const body = await res.json().catch(() => ({}));
        toast.add({
          title: "Gagal Menghapus Sub-kategori",
          description:
            typeof body.message === "string"
              ? body.message
              : "Sub-kategori tidak dapat dihapus.",
          type: "error",
        });
        return false;
      }
    } catch {
      toast.add({
        title: "Gagal Menghapus Sub-kategori",
        description: "Terjadi kesalahan jaringan saat menghapus sub-kategori.",
        type: "error",
      });
      return false;
    } finally {
      setIsDeletingSubCategory(false);
    }
  };

  const handleToggleAddon = (id: string) => {
    const next = currentAddonIds.includes(id)
      ? currentAddonIds.filter((x) => x !== id)
      : [...currentAddonIds, id];
    setValue("addonIds", next, { shouldValidate: true });
  };

  const handleAddNewAddon = async (
    name: string,
    price: number
  ): Promise<boolean> => {
    try {
      const res = await authorizedFetch("/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: price.toFixed(2),
          isActive: true,
        }),
      });

      if (res.ok) {
        const created = (await res.json()) as BackendAddon;
        setAddons((prev) => [...prev, created]);
        setValue("addonIds", [...currentAddonIds, created.id], {
          shouldValidate: true,
        });
        toast.add({
          title: "Topping Berhasil Ditambahkan",
          description: `Topping "${name.trim()}" berhasil dibuat dan dipilih.`,
          type: "success",
        });
        return true;
      } else {
        const body = await res.json().catch(() => ({}));
        toast.add({
          title: "Gagal Menambahkan Topping",
          description:
            typeof body.message === "string"
              ? body.message
              : "Tidak dapat membuat topping di server.",
          type: "error",
        });
        return false;
      }
    } catch {
      toast.add({
        title: "Gagal Menambahkan Topping",
        description: "Terjadi kesalahan jaringan saat membuat topping.",
        type: "error",
      });
      return false;
    }
  };

  const submitWithStatus = (
    targetStatus: "draft" | "published",
    keepOnPage = false
  ) => {
    setValue("status", targetStatus);

    const onValid = async (data: AddProductFormData) => {
      if (targetStatus === "published" && data.price <= 0) {
        toast.add({
          title: "Validasi Gagal",
          description:
            "Harga jual produk wajib lebih dari Rp 0 untuk disimpan.",
          type: "error",
        });
        return;
      }

      setSavingStatus(targetStatus);
      try {
        const catName = selectedCategoryName;
        const primaryImage =
          data.images && data.images.length > 0
            ? data.images[0]
            : getPresetImageForCategory(catName);

        const sellingPrice = data.price;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        // Resolve category id
        let targetCategoryId = selectedCategory?.id;
        if (!targetCategoryId || !uuidRegex.test(targetCategoryId)) {
          const matchedFromBackend = backendCategories.find(
            (c) =>
              c.name.toLowerCase() === catName.toLowerCase() &&
              uuidRegex.test(c.id)
          );
          if (matchedFromBackend) {
            targetCategoryId = matchedFromBackend.id;
          } else if (backendCategories.length > 0) {
            targetCategoryId = backendCategories[0].id;
          }
        }

        let validSubCategoryId: string | undefined = undefined;
        if (data.subCategory && uuidRegex.test(data.subCategory)) {
          validSubCategoryId = data.subCategory;
        }

        const isRealBackendProduct =
          resolvedProductId &&
          resolvedProductId !== "demo" &&
          uuidRegex.test(resolvedProductId);

        if (isRealBackendProduct) {
          // 1. Update product on backend via PATCH /products/:id
          const validVariants = (data.variants || [])
            .filter((v) => v.option.trim() && v.value.trim())
            .map((v) => ({
              id: v.id,
              option: v.option.trim(),
              value: v.value.trim(),
              price: Number(v.price) || 0,
            }));

          const updatePayload: Record<string, unknown> = {
            name: data.name.trim(),
            price: Number(sellingPrice).toFixed(2),
            sku: data.sku?.trim() || null,
            barcode: data.barcode?.trim() || null,
            description: data.description?.trim() || null,
            chargeTax: data.chargeTax ?? false,
            inStock: data.inStock ?? true,
            status: targetStatus,
            images: data.images ?? [],
            variants: validVariants,
            isActive: targetStatus === "published",
            isAvailable: data.inStock,
          };

          if (
            data.costPrice !== undefined &&
            data.costPrice !== null &&
            !isNaN(Number(data.costPrice))
          ) {
            updatePayload.costPrice = Number(data.costPrice).toFixed(2);
          } else {
            updatePayload.costPrice = null;
          }

          if (targetCategoryId && uuidRegex.test(targetCategoryId)) {
            updatePayload.categoryId = targetCategoryId;
          }
          if (validSubCategoryId) {
            updatePayload.subCategoryId = validSubCategoryId;
          } else {
            updatePayload.subCategoryId = null;
          }

          const patchRes = await authorizedFetch(
            `/products/${resolvedProductId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatePayload),
            }
          );

          if (!patchRes.ok) {
            const body = await patchRes.json().catch(() => ({}));
            const errMsg =
              typeof body.message === "string"
                ? body.message
                : Array.isArray(body.message)
                  ? body.message.join(", ")
                  : `Gagal memperbarui produk (${patchRes.status})`;
            throw new Error(errMsg);
          }

          // 2. Update Addons via PUT /products/:id/addons
          const selectedAddons = data.addonIds || [];
          try {
            await authorizedFetch(`/products/${resolvedProductId}/addons`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addonIds: selectedAddons }),
            });
          } catch (addonErr) {
            console.warn("Could not associate addons to product:", addonErr);
          }
        }

        const updatedItem: ProductItem = {
          id: resolvedProductId || "edited-product",
          name: data.name.trim(),
          sku:
            data.sku?.trim().toUpperCase() || generateSkuForCategory(catName),
          category: catName,
          price: sellingPrice,
          costPrice: data.costPrice,
          stock: (data.warehouseStock || 0) + (data.displayStock || 0),
          isAvailable: data.inStock,
          isActive: targetStatus === "published",
          soldCount: 0,
          rating: 5.0,
          image: primaryImage,
          description: data.description?.trim(),
        };

        if (onProductUpdated) {
          onProductUpdated(updatedItem);
        }

        toast.add({
          title: "Produk Berhasil Diperbarui",
          description: `Perubahan pada "${data.name.trim()}" telah disimpan.`,
          type: "success",
        });

        if (!keepOnPage) {
          navigate("/dashboard/products");
        }
      } catch (err) {
        toast.add({
          title: "Gagal Memperbarui Produk",
          description:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan sistem saat memperbarui data produk.",
          type: "error",
        });
      } finally {
        setSavingStatus(null);
      }
    };

    const onInvalid = (fieldErrors: FieldErrors<AddProductFormData>) => {
      const firstError = Object.values(fieldErrors)[0];
      toast.add({
        title: "Validasi Formulir Gagal",
        description:
          firstError?.message ||
          "Mohon periksa kembali kolom yang bertanda bintang (*).",
        type: "error",
      });
    };

    void handleSubmit(onValid, onInvalid)();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-310 space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2">
          {/* Back button + Title */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard/products")}
              title="Kembali ke daftar produk"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Edit Produk
                </h1>
                {isLoadingProduct && (
                  <Spinner className="size-4 text-zinc-400" />
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Perbarui rincian, harga, stok, dan kategori produk
              </p>
            </div>
          </div>

          {/* Action Buttons: Batal, Simpan Draf, Simpan Perubahan */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting || isSaving}
              onClick={() => navigate("/dashboard/products")}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || isSaving}
              onClick={() => submitWithStatus("draft")}
              className="gap-2"
            >
              {savingStatus === "draft" && <Spinner className="size-4" />}
              <span>
                {savingStatus === "draft" ? "Menyimpan Draf..." : "Simpan Draf"}
              </span>
            </Button>
            {/* Split Button: Simpan Perubahan | ▾ */}
            <div className="flex items-center -space-x-px">
              <Button
                type="button"
                variant="default"
                disabled={isSubmitting || isSaving}
                onClick={() => submitWithStatus("published", false)}
                className="rounded-r-none gap-2 pr-3"
              >
                {savingStatus === "published" ? (
                  <Spinner className="size-4" />
                ) : (
                  <IconCheck className="size-4" />
                )}
                <span>
                  {savingStatus === "published"
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="default"
                      size="icon"
                      disabled={isSubmitting || isSaving}
                      className="rounded-l-none px-2"
                      title="Opsi simpan lainnya"
                    >
                      <IconChevronDown className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="bg-[#18181b] border-zinc-800 text-zinc-200 min-w-[170px]"
                >
                  <DropdownMenuItem
                    onClick={() => submitWithStatus("published", true)}
                    className="cursor-pointer gap-2 py-2 text-xs md:text-sm hover:bg-zinc-800"
                  >
                    <span>Simpan & tetap di halaman</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Details, Images, Variants, Addons (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <DetailProduct control={control} errors={errors} />

            <ProductImage
              images={currentImages}
              onChange={(imgs) =>
                setValue("images", imgs, { shouldValidate: true })
              }
            />

            <ProductVariant control={control} />

            <ProductAddon
              addons={addons}
              selectedAddonIds={currentAddonIds}
              isLoading={isLoadingAddons}
              onToggleAddon={handleToggleAddon}
              onAddNewAddon={handleAddNewAddon}
            />
          </div>

          {/* RIGHT COLUMN: Pricing, Stock, Status, Categories (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <ProductPrice
              control={control}
              errors={errors}
              price={currentPrice}
              costPrice={currentCostPrice}
              chargeTax={currentChargeTax}
            />

            <ProductStock
              control={control}
              errors={errors}
              warehouseStock={currentWarehouseStock}
              displayStock={currentDisplayStock}
            />

            <ProductStatus control={control} currentStatus={currentStatus} />

            <ProductCategory
              control={control}
              categoriesList={categoriesList}
              subCategories={subCategories}
              currentCategory={currentCategory}
              currentSubCategory={currentSubCategory}
              isDeletingCategory={isDeletingCategory}
              isDeletingSubCategory={isDeletingSubCategory}
              isLoadingSubCategories={isLoadingSubCategories}
              onCategoryChange={handleCategoryChange}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddSubCategory={handleAddSubCategory}
              onDeleteSubCategory={handleDeleteSubCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
