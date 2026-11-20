import * as React from "react";
import { IconLock, IconLogout, IconShieldLock } from "@tabler/icons-react";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SessionLockModal() {
  const { user, isLocked, unlockSession, logout } = useAuth();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isLocked) {
      const timer = setTimeout(() => {
        setPassword("");
        setError(null);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const roleLabel =
    user?.role === "OWNER"
      ? "Pemilik Toko"
      : user?.role === "ADMIN"
        ? "Admin Toko"
        : "Kasir";

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Masukkan kata sandi Anda.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await unlockSession(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kata sandi salah.");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-lock-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in-0 duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconShieldLock className="size-8" />
          </div>

          <h2
            id="session-lock-title"
            className="text-xl font-bold tracking-tight"
          >
            Sesi Dikunci
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-balance">
            Sesi Anda dikunci setelah 10 menit tanpa aktivitas untuk menjaga
            keamanan sistem.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5">
            <span className="text-sm font-semibold">
              {user?.username ?? "Pengguna"}
            </span>
            <Badge variant="secondary" className="text-xs">
              {roleLabel}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="unlock-password"
              className="text-xs font-medium text-foreground"
            >
              Kata Sandi
            </label>
            <Input
              id="unlock-password"
              ref={inputRef}
              type="password"
              placeholder="Masukkan kata sandi untuk membuka kunci"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-xs font-medium text-destructive mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !password.trim()}
            >
              <IconLock className="mr-2 size-4" />
              {isSubmitting ? "Membuka Kunci…" : "Buka Kunci Sesi"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => void logout()}
            >
              <IconLogout className="mr-2 size-4" />
              Keluar / Ganti Akun
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
