import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import type {
  PosProductItem,
  PosAddon,
  PosCartItem,
  PosDiscount,
  PosCompletedTransaction,
} from "../types/posTypes";
import type { CashierShift } from "@/features/cashier/data/cashierData";

export function usePos() {
  const { authorizedFetch, user } = useAuth();

  // State
  const [products, setProducts] = useState<PosProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua Kategori"]);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Semua Kategori");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [currentShift, setCurrentShift] = useState<CashierShift | null>(null);
  const [discounts, setDiscounts] = useState<PosDiscount[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<PosDiscount | null>(
    null
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addonProduct, setAddonProduct] = useState<PosProductItem | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [lastTransaction, setLastTransaction] =
    useState<PosCompletedTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // 1. Fetch Current Shift
      try {
        const shiftRes = await authorizedFetch("/shifts/current", {
          signal: controller.signal,
        });
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          setCurrentShift(shiftData?.id ? shiftData : null);
        } else {
          setCurrentShift(null);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setCurrentShift(null);
      }

      // 2. Fetch Categories
      try {
        const catRes = await authorizedFetch("/categories", {
          signal: controller.signal,
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          const catList = Array.isArray(catData)
            ? catData
            : Array.isArray(catData?.data)
              ? catData.data
              : [];
          const activeNames = catList
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => c.name);
          setCategories(["Semua Kategori", ...activeNames]);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }

      // 3. Fetch Products with Display Stock
      try {
        const prodRes = await authorizedFetch("/products?limit=100", {
          signal: controller.signal,
        });
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          const rawItems = Array.isArray(prodJson.data)
            ? prodJson.data
            : Array.isArray(prodJson)
              ? prodJson
              : [];

          const mapped: PosProductItem[] = rawItems
            .filter((p: any) => p.isActive !== false)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || "",
              price: Number(p.price || 0),
              categoryName: p.categoryName || "Umum",
              categoryId: p.categoryId,
              displayStock: Number(p.displayStock ?? p.stock ?? 0),
              stock: Number(p.stock ?? 0),
              isAvailable: Boolean(p.isAvailable),
              isActive: Boolean(p.isActive),
              images: Array.isArray(p.images) ? p.images : [],
              addons: Array.isArray(p.addons)
                ? p.addons.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    price: Number(a.price || 0),
                    isActive: Boolean(a.isActive),
                  }))
                : [],
            }));

          setProducts(mapped);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }

      // 4. Fetch Discounts
      try {
        const discRes = await authorizedFetch("/discounts", {
          signal: controller.signal,
        });
        if (discRes.ok) {
          const discJson = await discRes.json();
          const rawDiscs = Array.isArray(discJson)
            ? discJson
            : Array.isArray(discJson?.data)
              ? discJson.data
              : [];
          const mappedDiscs: PosDiscount[] = rawDiscs
            .filter((d: any) => d.isActive !== false)
            .map((d: any) => ({
              id: d.id,
              name: d.name,
              code: d.code,
              type: d.type === "fixed" ? "fixed" : "percentage",
              applyMode: d.applyMode === "automatic" ? "automatic" : "manual",
              value: Number(d.value || 0),
              minPurchase: Number(d.minPurchase || 0),
              maxDiscount: d.maxDiscount ? Number(d.maxDiscount) : null,
              isActive: Boolean(d.isActive),
            }));
          setDiscounts(mappedDiscs);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    } catch (err: any) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Gagal memuat data POS");
    } finally {
      setIsLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    loadData();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadData]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((prod) => {
      const matchCat =
        selectedCategory === "Semua Kategori" ||
        prod.categoryName.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;

      if (!q) return true;
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSku = prod.sku?.toLowerCase().includes(q);
      return matchName || matchSku;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const addonTotal = item.selectedAddons.reduce(
        (aSum, a) => aSum + a.price,
        0
      );
      return sum + (item.unitPrice + addonTotal) * item.quantity;
    }, 0);
  }, [cart]);

  // Auto-apply discount if eligible and no manual discount selected
  useEffect(() => {
    if (selectedDiscount?.applyMode === "manual") return;

    const autoEligible = discounts.filter(
      (d) => d.applyMode === "automatic" && subtotal >= d.minPurchase
    );
    if (autoEligible.length > 0) {
      // Pick the discount giving highest saving
      let best = autoEligible[0];
      let maxSaving = 0;
      for (const d of autoEligible) {
        let saving =
          d.type === "percentage" ? (subtotal * d.value) / 100 : d.value;
        if (d.maxDiscount) saving = Math.min(saving, d.maxDiscount);
        if (saving > maxSaving) {
          maxSaving = saving;
          best = d;
        }
      }
      setSelectedDiscount(best);
    } else if (selectedDiscount?.applyMode === "automatic") {
      setSelectedDiscount(null);
    }
  }, [subtotal, discounts, selectedDiscount]);

  const discountAmount = useMemo(() => {
    if (!selectedDiscount) return 0;
    if (subtotal < selectedDiscount.minPurchase) return 0;

    let calc =
      selectedDiscount.type === "percentage"
        ? (subtotal * selectedDiscount.value) / 100
        : selectedDiscount.value;

    if (selectedDiscount.maxDiscount && calc > selectedDiscount.maxDiscount) {
      calc = selectedDiscount.maxDiscount;
    }
    return Math.min(Math.round(calc), subtotal);
  }, [selectedDiscount, subtotal]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Cart Actions
  const addToCart = useCallback(
    (
      product: PosProductItem,
      selectedAddons: PosAddon[] = [],
      notes: string = "",
      quantity = 1
    ) => {
      const addonIdsKey = [...selectedAddons]
        .map((a) => a.id)
        .sort()
        .join(",");
      const cartItemId = `${product.id}__${addonIdsKey}__${notes.trim()}`;

      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.cartItemId === cartItemId
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          const current = updated[existingIndex];
          const newQty = current.quantity + quantity;
          // check stock limit if applicable
          if (product.displayStock > 0 && newQty > product.displayStock) {
            return prev; // capped by display stock
          }
          updated[existingIndex] = { ...current, quantity: newQty };
          return updated;
        } else {
          return [
            ...prev,
            {
              cartItemId,
              productId: product.id,
              name: product.name,
              categoryName: product.categoryName,
              unitPrice: product.price,
              quantity,
              selectedAddons,
              notes: notes.trim(),
              displayStock: product.displayStock,
            },
          ];
        }
      });
    },
    []
  );

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (item.displayStock > 0 && newQty > item.displayStock) {
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item): item is PosCartItem => item !== null)
    );
  }, []);

  const updateNotes = useCallback((cartItemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, notes } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedDiscount(null);
  }, []);

  // Fetch full details of product with addons if product clicked
  const handleProductCardClick = useCallback(
    async (product: PosProductItem) => {
      if (!product.isAvailable || product.displayStock <= 0) return;

      // If product has addons or we should check /products/:id
      try {
        const res = await authorizedFetch(`/products/${product.id}`);
        if (res.ok) {
          const detailed = await res.json();
          const activeAddons = Array.isArray(detailed.addons)
            ? detailed.addons
                .filter((a: any) => a.isActive !== false)
                .map((a: any) => ({
                  id: a.id,
                  name: a.name,
                  price: Number(a.price || 0),
                  isActive: true,
                }))
            : [];

          if (activeAddons.length > 0) {
            setAddonProduct({
              ...product,
              addons: activeAddons,
            });
            return;
          }
        }
      } catch {
        // Fallback to basic add
      }

      // If no addons available, directly add to cart
      addToCart(product);
    },
    [authorizedFetch, addToCart]
  );

  // Submit Transaction
  const processCheckout = useCallback(
    async (paymentMethod: "CASH" | "QRIS", paidAmount: number) => {
      if (!currentShift || currentShift.closedAt) {
        throw new Error(
          "Shift kasir belum dibuka. Silakan buka shift terlebih dahulu."
        );
      }
      if (cart.length === 0) {
        throw new Error("Keranjang belanja masih kosong.");
      }

      // Validate payment coverage
      if (paymentMethod === "CASH" && paidAmount < totalAmount) {
        throw new Error("Uang tunai yang diterima kurang dari total tagihan.");
      }
      if (paymentMethod === "QRIS" && paidAmount !== totalAmount) {
        throw new Error(
          "Pembayaran QRIS harus sesuai dengan nominal transaksi."
        );
      }

      setIsSubmitting(true);
      setError(null);

      const idempotencyKey = crypto.randomUUID();

      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          addonIds: item.selectedAddons.map((a) => a.id),
        })),
        paymentMethod,
        paidAmount: paidAmount.toFixed(2),
      };

      try {
        const res = await authorizedFetch("/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = Array.isArray(errData.message)
            ? errData.message.join(", ")
            : errData.message || "Gagal memproses transaksi kasir.";
          throw new Error(msg);
        }

        const tx = await res.json();
        const changeAmount = Math.max(0, paidAmount - totalAmount);

        // Prepare completed transaction receipt
        const completed: PosCompletedTransaction = {
          id: tx.id || idempotencyKey,
          transactionNumber:
            tx.transactionNumber || `D13-${Date.now().toString().slice(-6)}`,
          shiftId: currentShift.id,
          cashierName: user?.username || "Kasir",
          createdAt: tx.createdAt || new Date().toISOString(),
          items: cart.map((i) => {
            const addonSum = i.selectedAddons.reduce((s, a) => s + a.price, 0);
            return {
              productId: i.productId,
              productName: i.name,
              categoryName: i.categoryName,
              quantity: i.quantity,
              unitPrice: i.unitPrice + addonSum,
              subtotalPrice: (i.unitPrice + addonSum) * i.quantity,
              addons: i.selectedAddons,
              notes: i.notes,
            };
          }),
          subtotalAmount: subtotal,
          discountAmount,
          discountReason: selectedDiscount
            ? `${selectedDiscount.name} (${selectedDiscount.code})`
            : undefined,
          totalAmount,
          paidAmount,
          changeAmount,
          paymentMethod,
        };

        setLastTransaction(completed);
        setIsPaymentOpen(false);
        setIsReceiptOpen(true);
        clearCart();

        // Refresh products in background to update display stock immediately
        loadData();

        return completed;
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memproses pembayaran.");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentShift,
      cart,
      totalAmount,
      subtotal,
      discountAmount,
      selectedDiscount,
      user?.username,
      authorizedFetch,
      clearCart,
      loadData,
    ]
  );

  const startNewTransaction = useCallback(() => {
    setLastTransaction(null);
    setIsReceiptOpen(false);
    clearCart();
  }, [clearCart]);

  return {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    cart,
    currentShift,
    discounts,
    selectedDiscount,
    setSelectedDiscount,
    subtotal,
    discountAmount,
    totalAmount,
    isLoading,
    isSubmitting,
    error,
    setError,
    addonProduct,
    setAddonProduct,
    isPaymentOpen,
    setIsPaymentOpen,
    lastTransaction,
    isReceiptOpen,
    setIsReceiptOpen,
    addToCart,
    updateQuantity,
    updateNotes,
    removeFromCart,
    clearCart,
    handleProductCardClick,
    processCheckout,
    startNewTransaction,
    refreshPos: loadData,
  };
}
