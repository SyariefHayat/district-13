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

type UserRole = "OWNER" | "ADMIN" | "CASHIER";
export type AuthUser = { username: string; role: UserRole };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authorizedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => Promise<Response>;
};
type TokenResponse = { accessToken: string; expiresIn: number };

const AuthContext = createContext<AuthContextValue | null>(null);
const USERNAME_KEY = "district-13.username";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const saveToken = useCallback((token: string) => {
    setAccessToken(token);
    setUser((current) => ({
      username: current?.username ?? sessionStorage.getItem(USERNAME_KEY) ?? "",
      role: readRole(token),
    }));
  }, []);

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
    let mounted = true;
    void refresh()
      .catch(() => null)
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch("/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getErrorMessage(body, response.status));
    sessionStorage.setItem(USERNAME_KEY, username);
    setUser({ username, role: readRole(body.accessToken) });
    setAccessToken(body.accessToken);
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(USERNAME_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

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

  const value = useMemo(
    () => ({ user, isLoading, login, logout, authorizedFetch }),
    [user, isLoading, login, logout, authorizedFetch]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

function readCookie(name: string) {
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function readRole(token: string): UserRole {
  try {
    const payload = token.split(".")[1];
    const claims = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (["OWNER", "ADMIN", "CASHIER"].includes(claims.role)) return claims.role;
  } catch {
    // The backend remains authoritative for authorization.
  }
  return "CASHIER";
}

function getErrorMessage(body: unknown, status: number) {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = body.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
  }
  if (status === 429) return "Too many login attempts. Please try again later.";
  return "Unable to sign in. Check your connection and try again.";
}
