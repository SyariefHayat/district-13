import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  getPresetImageForCategory,
  type ProductItem,
} from "../data/productData";

export interface BackendProduct {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
  categoryIsActive?: boolean;
  stock?: number;
  soldCount?: number;
  displayStock?: number;
}

export interface BackendCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ProductsApiResponse {
  data: BackendProduct[];
  page: number;
  limit: number;
  total: number;
}

function mapBackendProduct(p: BackendProduct): ProductItem {
  // Generate deterministic short SKU from UUID or category prefix
  const shortId = p.id.replace(/-/g, "").slice(0, 4).toUpperCase();
  const catPrefix = p.categoryName
    ? p.categoryName.slice(0, 3).toUpperCase()
    : "PRD";
  const sku = `${catPrefix}-${shortId}`;

  return {
    id: p.id,
    name: p.name,
    sku,
    category: p.categoryName || "General",
    price: Number(p.price) || 0,
    stock: Number(p.stock ?? p.displayStock ?? 0),
    isAvailable: Boolean(p.isAvailable),
    isActive: Boolean(p.isActive),
    soldCount: Number(p.soldCount ?? 0),
    image: getPresetImageForCategory(p.categoryName || ""),
  };
}

export function useProductData() {
  const { authorizedFetch } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        authorizedFetch("/products?page=1&limit=100", {
          signal: controller.signal,
        }),
        authorizedFetch("/categories", {
          signal: controller.signal,
        }).catch(() => null),
      ]);

      if (!productsRes.ok) {
        const body = await productsRes.json().catch(() => ({}));
        throw new Error(
          typeof body.message === "string"
            ? body.message
            : `Failed to fetch products (${productsRes.status})`
        );
      }

      const productsJson = (await productsRes.json()) as ProductsApiResponse;
      const mapped = (productsJson.data || []).map(mapBackendProduct);

      if (!controller.signal.aborted) {
        setProducts(mapped);
      }

      if (categoriesRes && categoriesRes.ok) {
        const categoriesJson = (await categoriesRes.json()) as
          BackendCategory[] | { data: BackendCategory[] };
        const rawCategories = Array.isArray(categoriesJson)
          ? categoriesJson
          : categoriesJson.data || [];
        const categoryNames = rawCategories
          .filter((c) => c.isActive)
          .map((c) => c.name);
        if (!controller.signal.aborted && categoryNames.length > 0) {
          setCategories(["Semua Kategori", ...categoryNames]);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [authorizedFetch]);

  useEffect(() => {
    void fetchProducts();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchProducts]);

  const toggleStatus = useCallback(
    async (productId: string) => {
      const target = products.find((p) => p.id === productId);
      if (!target) return;

      const newAvailable = !target.isAvailable;
      // Optimistic update
      setProducts((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, isAvailable: newAvailable } : item
        )
      );

      try {
        const res = await authorizedFetch(`/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: newAvailable }),
        });
        if (!res.ok) {
          // Rollback on error
          setProducts((prev) =>
            prev.map((item) =>
              item.id === productId
                ? { ...item, isAvailable: target.isAvailable }
                : item
            )
          );
        }
      } catch {
        // Rollback on error
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId
              ? { ...item, isAvailable: target.isAvailable }
              : item
          )
        );
      }
    },
    [products, authorizedFetch]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      const previous = [...products];
      // Optimistic remove
      setProducts((prev) => prev.filter((item) => item.id !== productId));

      try {
        const res = await authorizedFetch(`/products/${productId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setProducts(previous);
        }
      } catch {
        setProducts(previous);
      }
    },
    [products, authorizedFetch]
  );

  const deleteMultiple = useCallback(
    async (productIds: string[]) => {
      const previous = [...products];
      setProducts((prev) =>
        prev.filter((item) => !productIds.includes(item.id))
      );

      try {
        await Promise.all(
          productIds.map((id) =>
            authorizedFetch(`/products/${id}`, { method: "DELETE" })
          )
        );
      } catch {
        setProducts(previous);
      }
    },
    [products, authorizedFetch]
  );

  return {
    products,
    categories,
    isLoading,
    error,
    refetch: fetchProducts,
    toggleStatus,
    deleteProduct,
    deleteMultiple,
  };
}
