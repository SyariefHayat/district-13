import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "OWNER" | "ADMIN" | "CASHIER";
export type AuthUser = { username: string; role: UserRole };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isLocked: boolean;
  inactivityTimeoutMs: number;
  setInactivityTimeoutMs: (timeoutMs: number) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  lockSession: () => void;
  unlockSession: (password: string) => Promise<void>;
  authorizedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => Promise<Response>;
};

type TokenResponse = { accessToken: string; expiresIn: number };

const AuthContext = createContext<AuthContextValue | null>(null);

const USERNAME_KEY = "district-13.username";
const SESSION_LOCKED_KEY = "district-13.session-locked";
const INACTIVITY_TIMEOUT_KEY = "district-13.inactivity-timeout";
export const DEFAULT_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (REQ-F-USR-007, SEC-03)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(SESSION_LOCKED_KEY) === "true"
  );
  const [inactivityTimeoutMs, setInactivityTimeoutState] = useState<number>(
    () => {
      if (typeof window === "undefined") return DEFAULT_INACTIVITY_TIMEOUT_MS;
      const stored = localStorage.getItem(INACTIVITY_TIMEOUT_KEY);
      const parsed = stored ? Number.parseInt(stored, 10) : NaN;
      return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_INACTIVITY_TIMEOUT_MS;
    }
  );

  const setInactivityTimeoutMs = useCallback((timeoutMs: number) => {
    setInactivityTimeoutState(timeoutMs);
    localStorage.setItem(INACTIVITY_TIMEOUT_KEY, String(timeoutMs));
  }, []);

  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const lastActivityRef = useRef<number>(0);
  const refreshRef = useRef<() => Promise<string | null>>(() =>
    Promise.resolve(null)
  );

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(SESSION_LOCKED_KEY);
    if (autoRefreshTimerRef.current) {
      clearTimeout(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
    setAccessToken(null);
    setUser(null);
    setIsLocked(false);
  }, []);

  const lockSession = useCallback(() => {
    setIsLocked(true);
    sessionStorage.setItem(SESSION_LOCKED_KEY, "true");
  }, []);

  const scheduleAutoRefresh = useCallback((token: string) => {
    if (autoRefreshTimerRef.current) {
      clearTimeout(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    const { exp } = readTokenClaims(token);
    if (!exp) return;

    const expiresInMs = exp * 1000 - Date.now();
    // Schedule refresh 1 minute before expiry (or half time if shorter)
    const refreshDelay = Math.max(10_000, expiresInMs - 60_000);

    autoRefreshTimerRef.current = setTimeout(() => {
      // Proactively refresh only if tab is visible and not locked
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void refreshRef.current().catch(() => null);
      }
    }, refreshDelay);
  }, []);

  const saveToken = useCallback(
    (token: string) => {
      setAccessToken(token);
      const claims = readTokenClaims(token);
      setUser((current) => ({
        username:
          current?.username ?? sessionStorage.getItem(USERNAME_KEY) ?? "",
        role: claims.role,
      }));
      scheduleAutoRefresh(token);
    },
    [scheduleAutoRefresh]
  );

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const request = (async () => {
      const csrfToken = readCookie("csrf_token");
      if (!csrfToken) return null;
      const response = await fetch("/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": csrfToken },
      });
      if (!response.ok) return null;
      const body = (await response.json()) as TokenResponse;
      saveToken(body.accessToken);
      return body.accessToken;
    })();
    refreshInFlight.current = request;
    try {
      return await request;
    } finally {
      refreshInFlight.current = null;
    }
  }, [saveToken]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let mounted = true;
    void refresh()
      .catch(() => null)
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
    };
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await fetch("/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(body, response.status));
      sessionStorage.setItem(USERNAME_KEY, username);
      sessionStorage.removeItem(SESSION_LOCKED_KEY);
      const claims = readTokenClaims(body.accessToken);
      setUser({ username, role: claims.role });
      setAccessToken(body.accessToken);
      setIsLocked(false);
      lastActivityRef.current = Date.now();
      scheduleAutoRefresh(body.accessToken);
    },
    [scheduleAutoRefresh]
  );

  const unlockSession = useCallback(
    async (password: string) => {
      const currentUsername =
        user?.username || sessionStorage.getItem(USERNAME_KEY);
      if (!currentUsername) {
        clearSession();
        throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch("/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUsername, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(body, response.status));

      sessionStorage.removeItem(SESSION_LOCKED_KEY);
      const claims = readTokenClaims(body.accessToken);
      setUser({ username: currentUsername, role: claims.role });
      setAccessToken(body.accessToken);
      setIsLocked(false);
      lastActivityRef.current = Date.now();
      scheduleAutoRefresh(body.accessToken);
    },
    [clearSession, scheduleAutoRefresh, user]
  );

  const logout = useCallback(async () => {
    const csrfToken = readCookie("csrf_token");
    try {
      if (csrfToken) {
        await fetch("/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: { "X-CSRF-Token": csrfToken },
        });
      }
    } catch {
      // Remove local access even if the server cannot be reached.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const authorizedFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      // Update activity on authorized API calls
      lastActivityRef.current = Date.now();

      const send = (token: string | null) => {
        const headers = new Headers(init.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers, credentials: "same-origin" });
      };
      let response = await send(accessToken);
      if (response.status === 401) {
        const refreshedToken = await refresh();
        if (refreshedToken) response = await send(refreshedToken);
      }
      if (response.status === 401) clearSession();
      return response;
    },
    [accessToken, clearSession, refresh]
  );

  // Inactivity tracking (SEC-03, USR-007)
  useEffect(() => {
    if (!user || isLocked) return;

    // Only OWNER and ADMIN sessions lock on inactivity as per USR-007
    const shouldTrackInactivity =
      user.role === "OWNER" || user.role === "ADMIN";
    if (!shouldTrackInactivity) return;

    const onUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "pointerdown",
    ];
    for (const event of events) {
      window.addEventListener(event, onUserActivity, { passive: true });
    }

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= inactivityTimeoutMs) {
        lockSession();
      }
    }, 5000);

    return () => {
      for (const event of events) {
        window.removeEventListener(event, onUserActivity);
      }
      clearInterval(intervalId);
    };
  }, [user, isLocked, inactivityTimeoutMs, lockSession]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isLocked,
      inactivityTimeoutMs,
      setInactivityTimeoutMs,
      login,
      logout,
      lockSession,
      unlockSession,
      authorizedFetch,
    }),
    [
      user,
      isLoading,
      isLocked,
      inactivityTimeoutMs,
      setInactivityTimeoutMs,
      login,
      logout,
      lockSession,
      unlockSession,
      authorizedFetch,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function readTokenClaims(token: string): { role: UserRole; exp?: number } {
  try {
    const payload = token.split(".")[1];
    const claims = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const role: UserRole = ["OWNER", "ADMIN", "CASHIER"].includes(claims.role)
      ? claims.role
      : "CASHIER";
    return {
      role,
      exp: typeof claims.exp === "number" ? claims.exp : undefined,
    };
  } catch {
    return { role: "CASHIER" };
  }
}

function getErrorMessage(body: unknown, status: number) {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as Record<string, unknown>).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
  }
  if (status === 401) return "Nama pengguna atau kata sandi salah.";
  if (status === 429)
    return "Terlalu banyak percobaan masuk. Silakan coba lagi nanti.";
  return "Gagal masuk. Periksa koneksi dan coba lagi.";
}
