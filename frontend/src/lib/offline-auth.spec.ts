import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "./db";
import {
  derivePBKDF2Verifier,
  verifyPBKDF2,
  storeOfflineCredential,
  loginOffline,
  verifyOfflineUnlock,
  OWASP_PBKDF2_ITERATIONS,
} from "./offline-auth";

describe("Offline Cashier Login with PBKDF2 Verifier (T-43, SEC-06, USR-004)", () => {
  beforeEach(async () => {
    await db.open();
    await db.offlineCredentials.clear();
  });

  it("derives PBKDF2 verifier and never stores plaintext password in IndexedDB (AC for T-43, SEC-06)", async () => {
    const rawPassword = "super-secret-cashier-password-123!";
    const username = "kasir1";

    // Store credential verifier using 1000 iterations for test speed
    await storeOfflineCredential(
      username,
      rawPassword,
      "CASHIER",
      "Kasir Satu",
      true,
      1000
    );

    const stored = await db.offlineCredentials.get(username);
    expect(stored).toBeDefined();

    // Verifier and salt must be present
    expect(stored?.verifier).toBeDefined();
    expect(stored?.salt).toBeDefined();
    expect(stored?.verifier.length).toBe(64); // 256-bit hex
    expect(stored?.salt.length).toBe(32); // 128-bit hex

    // ACCEPTANCE CRITERIA: Inspect IndexedDB record to ensure plaintext password NEVER appears
    const serializedRecord = JSON.stringify(stored);
    expect(serializedRecord).not.toContain(rawPassword);
    expect(serializedRecord).not.toContain("super-secret");
    expect(serializedRecord).not.toContain("password");
  });

  it("verifies correct password against PBKDF2 verifier and rejects wrong password", async () => {
    const rawPassword = "myCashierPassword2026";
    const { verifierHex, saltHex } = await derivePBKDF2Verifier(
      rawPassword,
      undefined,
      1000
    );

    const isMatch = await verifyPBKDF2(rawPassword, saltHex, verifierHex, 1000);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPBKDF2(
      "wrongPassword",
      saltHex,
      verifierHex,
      1000
    );
    expect(isWrong).toBe(false);
  });

  it("loginOffline authenticates valid cashier credentials", async () => {
    const username = "kasir_d13";
    const password = "CorrectPassword@123";
    await storeOfflineCredential(
      username,
      password,
      "CASHIER",
      "Kasir Utama",
      true,
      1000
    );

    const result = await loginOffline(username, password);
    expect(result.username).toBe(username);
    expect(result.role).toBe("CASHIER");
    expect(result.fullName).toBe("Kasir Utama");
  });

  it("loginOffline rejects incorrect password", async () => {
    const username = "kasir_d13";
    const password = "CorrectPassword@123";
    await storeOfflineCredential(
      username,
      password,
      "CASHIER",
      "Kasir Utama",
      true,
      1000
    );

    await expect(loginOffline(username, "IncorrectPassword")).rejects.toThrow(
      "Kata sandi salah"
    );
  });

  it("loginOffline rejects unknown user with clear message", async () => {
    await expect(loginOffline("unknown_user", "any_password")).rejects.toThrow(
      "Akun ini belum pernah login di perangkat ini"
    );
  });

  it("loginOffline rejects inactive user accounts (REQ-F-USR-004)", async () => {
    const username = "deactivated_cashier";
    const password = "ValidPassword123";
    await storeOfflineCredential(
      username,
      password,
      "CASHIER",
      "Kasir Nonaktif",
      false,
      1000
    );

    await expect(loginOffline(username, password)).rejects.toThrow(
      "Akun Anda telah dinonaktifkan"
    );
  });

  it("verifyOfflineUnlock verifies offline session unlocking", async () => {
    const username = "kasir_lock";
    const password = "LockPassword123";
    await storeOfflineCredential(
      username,
      password,
      "CASHIER",
      "Kasir Lock",
      true,
      1000
    );

    expect(await verifyOfflineUnlock(username, password)).toBe(true);
    expect(await verifyOfflineUnlock(username, "badPassword")).toBe(false);
  });
});
