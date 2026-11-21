import { db, type LocalOfflineCredential } from "./db";
import type { UserRole } from "../context/auth-context";

export const OWASP_PBKDF2_ITERATIONS = 600000;

/**
 * Derives a PBKDF2 verifier using WebCrypto API with unique salt and OWASP iterations (T-43, SEC-06)
 */
export async function derivePBKDF2Verifier(
  password: string,
  saltBytes?: Uint8Array,
  iterations = OWASP_PBKDF2_ITERATIONS
): Promise<{ verifierHex: string; saltHex: string; iterations: number }> {
  const enc = new TextEncoder();
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  const verifierHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { verifierHex, saltHex, iterations };
}

/**
 * Verifies password against PBKDF2 verifier using constant-time comparison
 */
export async function verifyPBKDF2(
  password: string,
  saltHex: string,
  expectedVerifierHex: string,
  iterations = OWASP_PBKDF2_ITERATIONS
): Promise<boolean> {
  const matches = saltHex.match(/.{1,2}/g);
  if (!matches) return false;
  const saltBytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));

  const { verifierHex } = await derivePBKDF2Verifier(
    password,
    saltBytes,
    iterations
  );

  if (verifierHex.length !== expectedVerifierHex.length) return false;

  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < verifierHex.length; i++) {
    diff |= verifierHex.charCodeAt(i) ^ expectedVerifierHex.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Saves offline verifier to IndexedDB. Plaintext password is NEVER saved (SEC-06).
 */
export async function storeOfflineCredential(
  username: string,
  password: string,
  role: UserRole,
  fullName?: string,
  isActive = true,
  iterations = OWASP_PBKDF2_ITERATIONS
): Promise<void> {
  const normalizedUsername = username.trim().toLowerCase();
  const { verifierHex, saltHex } = await derivePBKDF2Verifier(
    password,
    undefined,
    iterations
  );

  const credentialRecord: LocalOfflineCredential = {
    username: normalizedUsername,
    salt: saltHex,
    verifier: verifierHex,
    iterations,
    role,
    fullName: fullName || normalizedUsername,
    isActive,
    lastSync: new Date().toISOString(),
  };

  await db.offlineCredentials.put(credentialRecord);
}

/**
 * Authenticates user offline against PBKDF2 verifier stored in IndexedDB (T-43, USR-004)
 */
export async function loginOffline(
  username: string,
  password: string
): Promise<{ username: string; role: UserRole; fullName: string }> {
  const normalizedUsername = username.trim().toLowerCase();
  const credential = await db.offlineCredentials.get(normalizedUsername);

  if (!credential) {
    throw new Error(
      "Akun ini belum pernah login di perangkat ini. Harap hubungkan internet untuk login pertama kali."
    );
  }

  // REQ-F-USR-004: Inactive accounts must be rejected
  if (!credential.isActive) {
    throw new Error("Akun Anda telah dinonaktifkan. Hubungi Administrator.");
  }

  const isValid = await verifyPBKDF2(
    password,
    credential.salt,
    credential.verifier,
    credential.iterations
  );

  if (!isValid) {
    throw new Error("Kata sandi salah.");
  }

  return {
    username: credential.username,
    role: credential.role,
    fullName: credential.fullName || credential.username,
  };
}

/**
 * Verifies offline session unlock
 */
export async function verifyOfflineUnlock(
  username: string,
  password: string
): Promise<boolean> {
  const normalizedUsername = username.trim().toLowerCase();
  const credential = await db.offlineCredentials.get(normalizedUsername);

  if (!credential || !credential.isActive) {
    return false;
  }

  return verifyPBKDF2(
    password,
    credential.salt,
    credential.verifier,
    credential.iterations
  );
}

/**
 * Updates offline credential active status (e.g., when syncing catalog/user list)
 */
export async function updateOfflineCredentialStatus(
  username: string,
  isActive: boolean
): Promise<void> {
  const normalizedUsername = username.trim().toLowerCase();
  const existing = await db.offlineCredentials.get(normalizedUsername);
  if (existing) {
    await db.offlineCredentials.update(normalizedUsername, { isActive });
  }
}
