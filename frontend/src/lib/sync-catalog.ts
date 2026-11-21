import { db } from "./db";
import { connectivity } from "./connectivity";

export interface CatalogSyncResult {
  success: boolean;
  productCount: number;
  stockCount: number;
  cursor?: string;
  error?: string;
}

/**
 * Synchronizes catalog, prices, discounts, settings, and stock from server to IndexedDB (T-41, OFF-002)
 */
export async function syncCatalogFromServer(
  apiBaseUrl = ""
): Promise<CatalogSyncResult> {
  if (connectivity.isOffline) {
    return { success: false, productCount: 0, stockCount: 0, error: "Offline" };
  }

  try {
    // 1. Read last cursor from settings store
    const cursorSetting = await db.settings.get("catalog_sync_cursor");
    const since = cursorSetting?.value;

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const url = new URL(`${apiBaseUrl}/sync/catalog`, origin);
    if (since) {
      url.searchParams.set("since", String(since));
    }

    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("token")
        : typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("token")
          : null;
    const res = await fetch(url.toString(), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      return {
        success: false,
        productCount: 0,
        stockCount: 0,
        error: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const {
      products,
      categories,
      subcategories,
      brands,
      addons,
      productAddons,
      discounts,
      settings,
      stock,
      cursor,
    } = data;

    // 2. Compute local unsynced deductions per product from outbox
    const unsyncedEvents = await db.outbox
      .where("status")
      .anyOf("pending", "syncing")
      .filter((e) => e.type === "sale.create")
      .toArray();

    const localUnsyncedDeltas = new Map<string, number>();
    for (const event of unsyncedEvents) {
      const items = event.payload?.items || [];
      for (const item of items) {
        const current = localUnsyncedDeltas.get(item.productId) || 0;
        localUnsyncedDeltas.set(
          item.productId,
          current + (Number(item.quantity) || 1)
        );
      }
    }

    // 3. Update Dexie in a transaction
    await db.transaction(
      "rw",
      [
        db.products,
        db.categories,
        db.subcategories,
        db.brands,
        db.addons,
        db.productAddons,
        db.discounts,
        db.settings,
        db.stock,
      ],
      async () => {
        if (Array.isArray(products) && products.length > 0) {
          await db.products.bulkPut(products);
        }
        if (Array.isArray(categories) && categories.length > 0) {
          await db.categories.bulkPut(categories);
        }
        if (Array.isArray(subcategories) && subcategories.length > 0) {
          await db.subcategories.bulkPut(subcategories);
        }
        if (Array.isArray(brands) && brands.length > 0) {
          await db.brands.bulkPut(brands);
        }
        if (Array.isArray(addons) && addons.length > 0) {
          await db.addons.bulkPut(addons);
        }
        if (Array.isArray(productAddons) && productAddons.length > 0) {
          await db.productAddons.bulkPut(productAddons);
        }
        if (Array.isArray(discounts) && discounts.length > 0) {
          await db.discounts.bulkPut(discounts);
        }
        if (settings && typeof settings === "object") {
          for (const [key, value] of Object.entries(settings)) {
            await db.settings.put({ key, value });
          }
        }

        // Stock adjustment: Local display stock = latest server stock - local unsynced delta
        if (Array.isArray(stock) && stock.length > 0) {
          const adjustedStock = stock.map(
            (s: { productId: string; displayStock: number }) => {
              const unsyncedReduction =
                localUnsyncedDeltas.get(s.productId) || 0;
              return {
                productId: s.productId,
                displayStock: Math.max(
                  0,
                  (Number(s.displayStock) || 0) - unsyncedReduction
                ),
                updatedAt: new Date().toISOString(),
              };
            }
          );
          await db.stock.bulkPut(adjustedStock);
        }

        if (cursor) {
          await db.settings.put({
            key: "catalog_sync_cursor",
            value: cursor,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    );

    return {
      success: true,
      productCount: products?.length || 0,
      stockCount: stock?.length || 0,
      cursor,
    };
  } catch (err: any) {
    return {
      success: false,
      productCount: 0,
      stockCount: 0,
      error: err?.message,
    };
  }
}
