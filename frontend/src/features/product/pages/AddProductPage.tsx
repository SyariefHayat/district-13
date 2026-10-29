import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { FieldErrors } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft, IconChevronDown } from "@tabler/icons-react";

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

interface AddProductPageProps {
  onProductCreated?: (product: ProductItem) => void;
}

export default function AddProductPage({
  onProductCreated,
}: AddProductPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authorizedFetch } = useAuth();

  const editId = searchParams.get("edit");
  React.useEffect(() => {
    if (editId) {
      navigate(`/dashboard/products/${editId}/edit`, { replace: true });
    }
  }, [editId, navigate]);

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

  const categoriesList = React.useMemo(() => {
    return backendCategories.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [backendCategories]);

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
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
      variants: [
        { id: "var-1", option: "", value: "", price: 0 },
        { id: "var-2", option: "", value: "", price: 0 },
      ],
      addonIds: [],
    },
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    setValue,
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

  // Load real categories from backend API on mount
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
          if (isMounted) {
            setBackendCategories(activeList);

            // Synchronize selected category to matching backend UUID if already set
            const currentVal = form.getValues("category");
            if (currentVal) {
              const matched = activeList.find(
                (c) =>
                  c.id === currentVal ||
                  c.name.toLowerCase() === currentVal.toLowerCase()
              );

              if (matched) {
                setValue("category", matched.id, { shouldValidate: true });
              } else {
                setValue("category", "", { shouldValidate: true });
                setValue("subCategory", "");
              }
            }
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
  }, [authorizedFetch, form, setValue]);

  // Load subcategories whenever selected category changes
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

  // Load real addons from backend API on mount
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
    if (isDeletingCategory) return;
    const targetCategory = categoriesList.find(
      (c) => c.id === currentCategory || c.name === currentCategory
    );
    if (!targetCategory) return;

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
  };

  const handleDeleteSubCategory = async (): Promise<boolean> => {
    if (isDeletingSubCategory || !currentSubCategory) return false;

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
              : "Sub-kategori tidak dapat dihapus (mungkin masih digunakan oleh produk aktif).",
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
            "Harga jual produk wajib lebih dari Rp 0 untuk diterbitkan.",
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

        // Resolve or create valid UUID categoryId on backend
        let targetCategoryId = selectedCategory?.id;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!targetCategoryId || !uuidRegex.test(targetCategoryId)) {
          const matchedFromBackend = backendCategories.find(
            (c) =>
              c.name.toLowerCase() === catName.toLowerCase() &&
              uuidRegex.test(c.id)
          );
          if (matchedFromBackend) {
            targetCategoryId = matchedFromBackend.id;
          } else {
            const createCatRes = await authorizedFetch("/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: catName }),
            });
            if (createCatRes.ok) {
              const newCat = (await createCatRes.json()) as BackendCategory;
              targetCategoryId = newCat.id;
              setBackendCategories((prev) => [...prev, newCat]);
            } else {
              const catErr = await createCatRes.json().catch(() => ({}));
              throw new Error(
                catErr.message ||
                  `Tidak dapat menetapkan kategori "${catName}". Silakan pilih atau buat kategori yang valid.`
              );
            }
          }
        }

        // 1. Create real product in backend database
        let validSubCategoryId: string | undefined = undefined;
        if (data.subCategory && uuidRegex.test(data.subCategory)) {
          validSubCategoryId = data.subCategory;
        }

        const validVariants = (data.variants || [])
          .filter((v) => v.option.trim() && v.value.trim())
          .map((v) => ({
            id: v.id,
            option: v.option.trim(),
            value: v.value.trim(),
            price: Number(v.price) || 0,
          }));

        const productPayload: {
          name: string;
          price: string;
          categoryId: string;
          subCategoryId?: string;
          sku?: string;
          barcode?: string;
          description?: string;
          costPrice?: string;
          chargeTax?: boolean;
          inStock?: boolean;
          status?: "draft" | "published" | "archived";
          images?: string[];
          variants?: typeof validVariants;
        } = {
          name: data.name.trim(),
          price: Number(sellingPrice).toFixed(2),
          categoryId: targetCategoryId,
          chargeTax: data.chargeTax ?? false,
          inStock: data.inStock ?? true,
          status: targetStatus,
          images: data.images ?? [],
          variants: validVariants,
        };
        if (validSubCategoryId) {
          productPayload.subCategoryId = validSubCategoryId;
        }
        if (data.sku?.trim()) {
          productPayload.sku = data.sku.trim();
        }
        if (data.barcode?.trim()) {
          productPayload.barcode = data.barcode.trim();
        }
        if (data.description?.trim()) {
          productPayload.description = data.description.trim();
        }
        if (
          data.costPrice !== undefined &&
          data.costPrice !== null &&
          !isNaN(Number(data.costPrice))
        ) {
          productPayload.costPrice = Number(data.costPrice).toFixed(2);
        }

        const productRes = await authorizedFetch("/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productPayload),
        });

        if (!productRes.ok) {
          const body = await productRes.json().catch(() => ({}));
          const errMsg =
            typeof body.message === "string"
              ? body.message
              : Array.isArray(body.message)
                ? body.message.join(", ")
                : `Gagal membuat produk (${productRes.status})`;
          throw new Error(errMsg);
        }

        const createdProduct = await productRes.json();

        // 1.5 Associate selected addons via PUT /products/:id/addons
        const selectedAddons = data.addonIds || [];
        if (selectedAddons.length > 0) {
          try {
            await authorizedFetch(`/products/${createdProduct.id}/addons`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addonIds: selectedAddons }),
            });
          } catch (addonErr) {
            console.warn("Could not associate addons to product:", addonErr);
          }
        }

        // 2. Compute initial stock & adjust active / availability status
        const warehouseQty = Math.max(0, Number(data.warehouseStock || 0));
        const displayQty = Math.max(0, Number(data.displayStock || 0));
        const totalInitialStock = warehouseQty + displayQty;

        const shouldBeActive = targetStatus === "published";
        const shouldBeAvailable = totalInitialStock > 0;

        if (!shouldBeActive || !shouldBeAvailable) {
          try {
            await authorizedFetch(`/products/${createdProduct.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                isActive: shouldBeActive,
                isAvailable: shouldBeAvailable,
              }),
            });
          } catch (patchErr) {
            console.warn(
              "Could not update product status/availability:",
              patchErr
            );
          }
        }

        // 3. Provision stock into Warehouse and Display locations
        if (shouldBeAvailable && totalInitialStock > 0) {
          try {
            const restockRes = await authorizedFetch("/inventory/restock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: createdProduct.id,
                quantity: totalInitialStock,
              }),
            });

            if (restockRes.ok && displayQty > 0) {
              await authorizedFetch("/inventory/transfer-to-display", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: createdProduct.id,
                  quantity: displayQty,
                }),
              });
            }
          } catch (invErr) {
            console.warn("Could not provision initial inventory:", invErr);
          }
        }

        // 4. Callback for local consumers if provided
        const createdItem: ProductItem = {
          id: createdProduct.id,
          name: createdProduct.name,
          sku:
            data.sku?.trim().toUpperCase() || generateSkuForCategory(catName),
          category: catName,
          price: Number(createdProduct.price) || sellingPrice,
          costPrice: data.costPrice,
          stock: shouldBeAvailable ? totalInitialStock : 0,
          isAvailable: shouldBeAvailable,
          isActive: shouldBeActive,
          soldCount: 0,
          rating: 5.0,
          image: primaryImage,
          description: data.description?.trim(),
        };

        if (onProductCreated) {
          onProductCreated(createdItem);
        }

        toast.add({
          title:
            targetStatus === "published"
              ? "Produk Berhasil Diterbitkan"
              : "Draf Berhasil Disimpan",
          description: `"${data.name.trim()}" telah tersimpan ke database.`,
          type: "success",
        });

        if (keepOnPage) {
          form.reset({
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
            category: data.category,
            subCategory: data.subCategory || "",
            variants: [
              {
                id: `var-${Date.now()}-1`,
                option: "",
                value: "",
                price: 0,
              },
              {
                id: `var-${Date.now()}-2`,
                option: "",
                value: "",
                price: 0,
              },
            ],
            addonIds: [],
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/dashboard/products");
        }
      } catch (err) {
        toast.add({
          title: "Gagal Menyimpan Produk",
          description:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan sistem saat menyimpan ke database.",
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
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Tambah Produk
              </h1>
            </div>
          </div>

          {/* Action Buttons: Discard, Save Draft, Publish */}
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
            {/* Split Button: Terbitkan | ▾ */}
            <div className="flex items-center -space-x-px">
              <Button
                type="button"
                variant="default"
                disabled={isSubmitting || isSaving}
                onClick={() => submitWithStatus("published", false)}
                className="rounded-r-none gap-2 pr-3"
              >
                {savingStatus === "published" && <Spinner className="size-4" />}
                <span>
                  {savingStatus === "published"
                    ? "Menerbitkan..."
                    : "Terbitkan"}
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
                      className="rounded-l-none px-2 "
                      title="Opsi terbitkan lainnya"
                    >
                      <IconChevronDown className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="bg-[#18181b] border-zinc-800 text-zinc-200 min-w-[140px]"
                >
                  <DropdownMenuItem
                    onClick={() => submitWithStatus("published", true)}
                    className="cursor-pointer gap-2 py-2 text-xs md:text-sm hover:bg-zinc-800"
                  >
                    <span>Simpan & lanjut</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Details, Images, Variants (8 cols) */}
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
