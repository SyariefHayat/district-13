import * as React from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft } from "@tabler/icons-react";

import { toast } from "@/components/ui/toast";
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
} from "../components/form";

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

const DEFAULT_CATEGORY_MAP: Record<string, string[]> = {
  Kopi: [
    "Kopi Hitam",
    "Kopi Susu Racik",
    "Top Cappucino",
    "Torabika Moka",
    "Good Day Vanilla Latte",
    "Good Day Freeze",
    "Good Day Mocacino",
    "Good Day Cappucino",
    "Good Day Carrabian Nut",
    "Luwak White Coffee",
    "Kopi Tubruk",
  ],
  "Minuman Sachet": [
    "Nutrisari (Jeruk, Lemon, Leci, Cocopandan)",
    "Pop Ice (Coklat, Mangga, Strawberry, dll.)",
    "Chocolatos",
    "Milo",
    "Bengbeng Drink",
    "Tea Jus",
    "SKM Putih",
    "Air Mineral AKEO",
  ],
  Makanan: [
    "Indomie Goreng + Telur",
    "Indomie Kuah + Telur",
    "Indomie Rawon Pedas Mercon + Telur",
    "Indomie BAWA SENDIRI",
    "Mie Sedaap + Telur",
    "Sego Sambel Telur",
    "Sego Sambel Ayam",
    "Sego Sambel Tahu Tempe",
    "Nasi Bungkus",
  ],
  "Gorengan & Snack": [
    "Tempe Mendoan",
    "Tahu Bakso",
    "Tahu Goreng / Crispy",
    "Risol",
    "Gorengan",
    "Mix Platter (Sosis, Nugget, Kentang)",
    "Cireng",
    "Siomay Goreng",
    "Usus Krispi",
    "Kacang",
    "Kerupuk",
  ],
  "Minuman Dingin & Kaleng": [
    "Teh Tarik RACIK",
    "Teh Manis",
    "Zenlatte Thai Tea",
    "Zenlatte Matcha",
    "Extrajoss (Kaleng / Susu)",
    "Kukubima Susu",
    "Coca Cola / Sprite / Fanta",
    "Energen",
    "Lemon Tea",
  ],
};

interface AddProductPageProps {
  onProductCreated?: (product: ProductItem) => void;
}

export default function AddProductPage({
  onProductCreated,
}: AddProductPageProps) {
  const navigate = useNavigate();
  const { authorizedFetch } = useAuth();

  const [backendCategories, setBackendCategories] = React.useState<
    BackendCategory[]
  >([]);
  const [categoryMap, setCategoryMap] = React.useState(DEFAULT_CATEGORY_MAP);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = React.useState(false);

  const categoriesList = React.useMemo(() => {
    if (backendCategories.length > 0) {
      return backendCategories.map((c) => ({
        id: c.id,
        name: c.name,
      }));
    }
    return DEFAULT_CATEGORY_OPTIONS;
  }, [backendCategories]);

  const categoryItems = React.useMemo(() => {
    return categoriesList.reduce<Record<string, string>>((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});
  }, [categoriesList]);

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
      warehouseStock: 50,
      displayStock: 20,
      status: "published",
      category: DEFAULT_CATEGORY_OPTIONS[0].id,
      subCategory: DEFAULT_CATEGORY_MAP["Kopi"]?.[0] || "",
      variants: [
        { id: "var-1", option: "Suhu / Penyajian", value: "Panas", price: 0 },
        {
          id: "var-2",
          option: "Suhu / Penyajian",
          value: "Dingin / Es",
          price: 2000,
        },
      ],
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
          if (isMounted && activeList.length > 0) {
            setBackendCategories(activeList);

            // Synchronize selected category to matching backend UUID
            const currentVal = form.getValues("category");
            const matchedById = activeList.find((c) => c.id === currentVal);
            const matchedByName = activeList.find(
              (c) => c.name.toLowerCase() === currentVal.toLowerCase()
            );

            if (matchedById) {
              setValue("category", matchedById.id, { shouldValidate: true });
            } else if (matchedByName) {
              setValue("category", matchedByName.id, { shouldValidate: true });
            } else {
              const firstCat = activeList[0];
              setValue("category", firstCat.id, { shouldValidate: true });
              const subs = categoryMap[firstCat.name] || [];
              setValue("subCategory", subs[0] || "");
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
  }, [authorizedFetch, categoryMap, form, setValue]);

  const selectedCategory = categoriesList.find(
    (c) => c.id === currentCategory || c.name === currentCategory
  );
  const selectedCategoryName =
    selectedCategory?.name || categoriesList[0]?.name || "";

  const subCategories = categoryMap[selectedCategoryName] || [];

  const handleCategoryChange = (val: string | null) => {
    if (!val) return;
    setValue("category", val, { shouldValidate: true });
    const matched = categoriesList.find((c) => c.id === val || c.name === val);
    const catName = matched ? matched.name : val;
    const nextSubs = categoryMap[catName] || [];
    setValue("subCategory", nextSubs[0] || "");
  };

  const handleAddCategory = async () => {
    const newCat = window.prompt("Masukkan nama kategori baru:");
    if (!newCat || !newCat.trim()) return;
    const trimmed = newCat.trim();

    try {
      const res = await authorizedFetch("/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const createdCat = (await res.json()) as BackendCategory;
        setBackendCategories((prev) => [...prev, createdCat]);
        setCategoryMap((prev) => ({ ...prev, [trimmed]: [] }));
        setValue("category", createdCat.id, { shouldValidate: true });
        setValue("subCategory", "");
        toast.add({
          title: "Kategori Berhasil Dibuat",
          description: `Kategori "${trimmed}" berhasil ditambahkan.`,
          type: "success",
        });
        return;
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
      }
    } catch {
      if (!categoryMap[trimmed]) {
        setCategoryMap((prev) => ({ ...prev, [trimmed]: [] }));
      }
      setValue("category", trimmed, { shouldValidate: true });
      setValue("subCategory", "");
    }
  };

  const handleAddSubCategory = () => {
    if (!selectedCategoryName) {
      alert("Silakan pilih kategori terlebih dahulu.");
      return;
    }
    const newSub = window.prompt(
      `Masukkan sub-kategori baru untuk "${selectedCategoryName}":`
    );
    if (newSub && newSub.trim()) {
      const trimmed = newSub.trim();
      setCategoryMap((prev) => ({
        ...prev,
        [selectedCategoryName]: [
          ...(prev[selectedCategoryName] || []),
          trimmed,
        ],
      }));
      setValue("subCategory", trimmed);
    }
  };

  const handleDeleteCategory = async () => {
    const targetCategory = categoriesList.find(
      (c) => c.id === currentCategory || c.name === currentCategory
    );
    if (!targetCategory) return;

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus kategori "${targetCategory.name}"?`
    );
    if (!confirmDelete) return;

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
          setCategoryMap((prev) => {
            const next = { ...prev };
            delete next[targetCategory.name];
            return next;
          });
          const nextCat = remaining[0];
          if (nextCat) {
            setValue("category", nextCat.id, { shouldValidate: true });
            const nextSubs = categoryMap[nextCat.name] || [];
            setValue("subCategory", nextSubs[0] || "");
          } else {
            setValue("category", "", { shouldValidate: true });
            setValue("subCategory", "");
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
      setCategoryMap((prev) => {
        const next = { ...prev };
        delete next[targetCategory.name];
        return next;
      });
      const remainingDefaults = categoriesList.filter(
        (c) => c.id !== targetCategory.id
      );
      const nextCat = remainingDefaults[0];
      if (nextCat) {
        setValue("category", nextCat.id, { shouldValidate: true });
        setValue("subCategory", categoryMap[nextCat.name]?.[0] || "");
      } else {
        setValue("category", "", { shouldValidate: true });
        setValue("subCategory", "");
      }
      toast.add({
        title: "Kategori Berhasil Dihapus",
        description: `Kategori "${targetCategory.name}" berhasil dihapus.`,
        type: "success",
      });
    }
  };

  const handleDeleteSubCategory = () => {
    if (!selectedCategoryName || !currentSubCategory) return;
    const confirmDelete = window.confirm(
      `Hapus sub-kategori "${currentSubCategory}" dari "${selectedCategoryName}"?`
    );
    if (!confirmDelete) return;

    setCategoryMap((prev) => {
      const existing = prev[selectedCategoryName] || [];
      const updated = existing.filter((s) => s !== currentSubCategory);
      return {
        ...prev,
        [selectedCategoryName]: updated,
      };
    });
    setValue("subCategory", "");
    toast.add({
      title: "Sub-kategori Berhasil Dihapus",
      description: `Sub-kategori "${currentSubCategory}" telah dihapus.`,
      type: "success",
    });
  };

  const submitWithStatus = (targetStatus: "draft" | "published") => {
    setValue("status", targetStatus);
    handleSubmit(async (data) => {
      setIsSaving(true);
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
              throw new Error(
                `Tidak dapat menetapkan kategori "${catName}". Silakan pilih atau buat kategori yang valid.`
              );
            }
          }
        }

        // 1. Create real product in backend database
        const productRes = await authorizedFetch("/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name.trim(),
            price: Number(sellingPrice).toFixed(2),
            categoryId: targetCategoryId,
          }),
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
            await authorizedFetch("/inventory/restock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: createdProduct.id,
                quantity: totalInitialStock,
              }),
            });

            if (displayQty > 0) {
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
          description: `"${data.name}" telah ${
            targetStatus === "published"
              ? "berhasil diterbitkan ke sistem"
              : "disimpan sebagai draf"
          }.`,
          type: targetStatus === "published" ? "success" : "info",
        });

        navigate("/dashboard/products");
      } catch (err) {
        toast.add({
          title: "Gagal Menyimpan",
          description:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat menyimpan produk",
          type: "error",
        });
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-[1240px] space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2">
          {/* Back button + Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/products")}
              className="size-9 rounded-xl border border-zinc-800 bg-[#141416] text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Kembali ke daftar produk"
            >
              <IconChevronLeft className="size-4" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Tambah Produk
              </h1>
              <p className="text-xs text-zinc-400">
                Lengkapi rincian produk, harga, stok, dan kategori katalog.
              </p>
            </div>
          </div>

          {/* Action Buttons: Discard, Save Draft, Publish */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting || isSaving}
              onClick={() => navigate("/dashboard/products")}
              className="h-9 px-4 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting || isSaving}
              onClick={() => submitWithStatus("draft")}
              className="h-9 px-4 rounded-xl text-sm font-medium bg-[#1c1c20] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Menyimpan..." : "Simpan Draf"}
            </button>
            <button
              type="button"
              disabled={isSubmitting || isSaving}
              onClick={() => submitWithStatus("published")}
              className="h-9 px-5 rounded-xl text-sm font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Menerbitkan..." : "Terbitkan"}
            </button>
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
              categoryItems={categoryItems}
              subCategories={subCategories}
              currentCategory={currentCategory}
              currentSubCategory={currentSubCategory}
              isDeletingCategory={isDeletingCategory}
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
