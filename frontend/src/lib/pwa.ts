/**
 * PWA Service Worker Registration and Persistent Storage Manager (T-39, OFF-011)
 */

export type StoragePersistListener = (persisted: boolean) => void;

let persistListeners: StoragePersistListener[] = [];
let isPersistedState: boolean | null = null;

export function onStoragePersistChange(listener: StoragePersistListener) {
  persistListeners.push(listener);
  if (isPersistedState !== null) {
    listener(isPersistedState);
  }
  return () => {
    persistListeners = persistListeners.filter((l) => l !== listener);
  };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !navigator.storage ||
    !navigator.storage.persist
  ) {
    isPersistedState = false;
    persistListeners.forEach((l) => l(false));
    return false;
  }

  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) {
      isPersistedState = true;
      persistListeners.forEach((l) => l(true));
      return true;
    }

    const granted = await navigator.storage.persist();
    isPersistedState = granted;
    persistListeners.forEach((l) => l(granted));
    return granted;
  } catch (err) {
    console.warn("Persistent storage request failed:", err);
    isPersistedState = false;
    persistListeners.forEach((l) => l(false));
    return false;
  }
}

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.info("Service Worker registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    });
  }
}
