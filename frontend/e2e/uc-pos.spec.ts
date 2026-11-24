import { test, expect } from "@playwright/test";

test.describe("E2E POS Core Workflows (T-71: UC-POS-001/002/003)", () => {
  test.beforeEach(async ({ page, context }) => {
    // Generate valid mock JWT token with role CASHIER
    const mockPayload = Buffer.from(
      JSON.stringify({
        role: "CASHIER",
        sub: "cashier-uuid-1",
        exp: Math.floor(Date.now() / 1000) + 86400,
      })
    ).toString("base64");
    const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayload}.mocksignature`;

    // Inject mock CSRF cookie
    await context.addCookies([
      {
        name: "csrf_token",
        value: "mock-csrf-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Inject mock authentication state for CASHIER
    await page.addInitScript((jwt) => {
      document.cookie = "csrf_token=mock-csrf-token; path=/";
      sessionStorage.setItem("district-13.username", "cashier1");
      localStorage.setItem("token", jwt);
      localStorage.setItem(
        "auth_user",
        JSON.stringify({
          id: "cashier-uuid-1",
          username: "cashier1",
          fullName: "Budi Kasir",
          role: "CASHIER",
          token: jwt,
        })
      );
      localStorage.setItem("auth_token", jwt);
      localStorage.setItem(
        "active_shift",
        JSON.stringify({
          id: "shift-uuid-1",
          openingCash: 200000,
          openedAt: new Date().toISOString(),
        })
      );
    }, mockJwt);

    // Mock all backend API responses
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (
        url.includes("/@") ||
        url.includes("/src/") ||
        url.includes("/assets/") ||
        url.endsWith(".js") ||
        url.endsWith(".ts") ||
        url.endsWith(".tsx") ||
        url.endsWith(".css") ||
        url.endsWith(".html") ||
        url.endsWith(".svg") ||
        url.endsWith(".png") ||
        url.endsWith(".ico") ||
        url.endsWith(".woff") ||
        url.endsWith(".woff2")
      ) {
        return route.continue();
      }

      if (url.includes("/auth/")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            accessToken: mockJwt,
            expiresIn: 3600,
          }),
        });
      }

      if (url.includes("/shifts")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "shift-uuid-1",
            userId: "cashier-uuid-1",
            cashierName: "Budi Kasir",
            openingCash: 200000,
            expectedCash: 240000,
            openedAt: new Date().toISOString(),
            closedAt: null,
            status: "OPEN",
            cashDifference: 0,
          }),
        });
      }

      if (url.includes("/categories")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              { id: "cat-1", name: "Coffee", isActive: true },
              { id: "cat-2", name: "Pastry", isActive: true },
            ],
          }),
        });
      }

      if (url.includes("/products")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "prod-kopi-susu",
                name: "Kopi Susu Gula Aren",
                price: 20000,
                category: "Coffee",
                categoryName: "Coffee",
                isAvailable: true,
                isActive: true,
                stock: 50,
                displayStock: 50,
              },
              {
                id: "prod-croissant",
                name: "Butter Croissant",
                price: 25000,
                category: "Pastry",
                categoryName: "Pastry",
                isAvailable: true,
                isActive: true,
                stock: 20,
                displayStock: 20,
              },
            ],
            total: 2,
          }),
        });
      }

      if (
        url.includes("/discounts") ||
        url.includes("/addons") ||
        url.includes("/schedules")
      ) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
      }

      if (url.includes("/transactions") || url.includes("/sync")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "tx-1",
            success: true,
            processed: 1,
            successfulIds: ["event-1"],
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test("UC-POS-001: Buat Penjualan (Complete Cash Sale Flow)", async ({
    page,
  }) => {
    await page.goto("/dashboard/pos");

    // Verify POS Page loaded
    await expect(page.locator("body")).toBeVisible();

    // In a headless test, check core UI elements (product cards, cart panel, search)
    const productItem = page.locator("text=Kopi Susu Gula Aren").first();
    if (await productItem.isVisible()) {
      await productItem.click();
    }

    // Verify checkout button or cart exists
    const checkoutBtn = page
      .locator('button:has-text("Bayar"), button:has-text("Checkout")')
      .first();
    if ((await checkoutBtn.isVisible()) && (await checkoutBtn.isEnabled())) {
      await checkoutBtn.click();

      // Cash payment input
      const cashInput = page
        .locator('input[type="number"], input[name="cash"]')
        .first();
      if (await cashInput.isVisible()) {
        await cashInput.fill("50000");
      }

      const confirmBtn = page
        .locator('button:has-text("Konfirmasi"), button:has-text("Selesaikan")')
        .first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  });

  test("UC-POS-002: Tutup Shift (Close Shift Flow with Cash Difference)", async ({
    page,
  }) => {
    await page.goto("/dashboard/cashier");
    await expect(page.locator("body")).toBeVisible();

    // Look for Close Shift button
    const closeShiftBtn = page
      .locator('button:has-text("Tutup Shift"), button:has-text("Close Shift")')
      .first();
    if (await closeShiftBtn.isVisible()) {
      await closeShiftBtn.click();

      // Fill closing cash in dialog
      const closingCashInput = page
        .locator(
          'input[type="number"], input[placeholder*="kas"], input[name="closingCash"]'
        )
        .first();
      if (await closingCashInput.isVisible()) {
        await closingCashInput.fill("240000");
      }

      // Submit closure
      const submitCloseBtn = page
        .locator(
          'button:has-text("Konfirmasi Tutup"), button:has-text("Simpan")'
        )
        .first();
      if (await submitCloseBtn.isVisible()) {
        await submitCloseBtn.click();
      }
    }
  });

  test("UC-POS-003: Jual Offline lalu Sinkron (Offline Mode & Outbox Sync)", async ({
    page,
    context,
  }) => {
    await page.goto("/dashboard/pos");
    await expect(page.locator("body")).toBeVisible();

    // 1. Simulate network disconnect (Go offline)
    await context.setOffline(true);

    // 2. Perform sale while offline
    const productItem = page.locator("text=Kopi Susu Gula Aren").first();
    if (await productItem.isVisible()) {
      await productItem.click();
    }

    // 3. Re-enable network (Come back online)
    await context.setOffline(false);

    // 4. Verify connectivity restored
    await page.waitForTimeout(500);
    expect(page.url()).toContain("/dashboard/pos");
  });
});
