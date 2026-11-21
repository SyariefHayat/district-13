/**
 * Connectivity Detector with 3-second ping timeout (T-42, OFF-001, REL-04)
 */

export type ConnectivityListener = (isOnline: boolean) => void;

class ConnectivityManager {
  private isOnlineStatus: boolean =
    typeof navigator !== "undefined" ? navigator.onLine : true;
  private listeners: ConnectivityListener[] = [];
  private checkIntervalId: any = null;
  private isChecking: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleBrowserSignal(true));
      window.addEventListener("offline", () => this.handleBrowserSignal(false));
      // Periodic ping every 10 seconds
      this.checkIntervalId = setInterval(
        () => this.checkServerConnectivity(),
        10000
      );
      // Immediate initial check
      this.checkServerConnectivity();
    }
  }

  get isOnline(): boolean {
    return this.isOnlineStatus;
  }

  get isOffline(): boolean {
    return !this.isOnlineStatus;
  }

  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.push(listener);
    listener(this.isOnlineStatus);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private handleBrowserSignal(browserOnline: boolean) {
    if (!browserOnline) {
      this.setOnlineStatus(false);
    } else {
      // Browser says online, verify actively with 3s ping to server
      this.checkServerConnectivity();
    }
  }

  /**
   * Active ping with 3000ms timeout
   */
  async checkServerConnectivity(): Promise<boolean> {
    if (this.isChecking) return this.isOnlineStatus;
    this.isChecking = true;

    try {
      // Use AbortController for reliable 3-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Ping /api/health or /health or /api/v1/health
      const response = await fetch("/health", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }).catch(async () => {
        // Fallback try /api/health
        return fetch("/api/v1/health", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);

      const reachable = response.ok;
      this.setOnlineStatus(reachable);
      return reachable;
    } catch {
      // Timeout, network error, or server down -> switch to offline mode
      this.setOnlineStatus(false);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  setOnlineStatus(online: boolean) {
    if (this.isOnlineStatus !== online) {
      this.isOnlineStatus = online;
      this.listeners.forEach((listener) => listener(online));
    }
  }

  destroy() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
  }
}

export const connectivity = new ConnectivityManager();
