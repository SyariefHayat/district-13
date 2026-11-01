import * as React from "react";
import { useNavigate, useParams } from "react-router";
import {
  IconCheck,
  IconChevronLeft,
  IconEye,
  IconEyeOff,
  IconShield,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import {
  mapBackendUser,
  ROLE_CONFIG,
  type BackendUser,
  type UserItem,
  type UserRole,
} from "../data/userData";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authorizedFetch } = useAuth();

  const [user, setUser] = React.useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>("CASHIER");
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Fetch user details
  React.useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      if (!id) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await authorizedFetch("/users");
        if (!response.ok) throw new Error("Gagal mengambil data pengguna");
        const list = (await response.json()) as BackendUser[];
        const found = list.find((u) => u.id === id);
        if (!found) throw new Error("Akun karyawan tidak ditemukan");

        if (isMounted) {
          const mapped = mapBackendUser(found);
          setUser(mapped);
          setUsername(mapped.username);
          setRole(mapped.role);
          setIsActive(mapped.isActive);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(
            err instanceof Error ? err.message : "Gagal memuat profil pengguna"
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchUser();
    return () => {
      isMounted = false;
    };
  }, [id, authorizedFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setErrorMsg("Nama pengguna (username) wajib diisi");
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMsg("Nama pengguna minimal 3 karakter");
      return;
    }

    if (password && password.length < 8) {
      setErrorMsg("Kata sandi baru minimal 8 karakter");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: {
        username: string;
        password?: string;
        role: UserRole;
        isActive: boolean;
      } = {
        username: cleanUsername,
        role,
        isActive,
      };

      if (password) {
        payload.password = password;
      }

      const response = await authorizedFetch(`/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errDetail =
          body?.message || `Gagal memperbarui pengguna (${response.status})`;
        throw new Error(
          Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
        );
      }

      toast.add({
        title: "Perubahan disimpan",
        description: `Profil karyawan "${cleanUsername}" berhasil diperbarui.`,
      });

      navigate("/dashboard/users");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          {/* Back button + Title */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard/users")}
              title="Kembali ke daftar karyawan"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Ubah Data Karyawan
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Perbarui username, tingkat peran, status aktif, atau setel kata
                sandi baru.
              </p>
            </div>
          </div>

          {/* Action Buttons: Batal & Simpan */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting || isLoading}
              onClick={() => navigate("/dashboard/users")}
              className="gap-1.5"
            >
              <IconX className="size-4" />
              <span>Batal</span>
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              disabled={isSubmitting || isLoading}
              className="gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <Spinner className="size-4" />
              ) : (
                <IconCheck className="size-4" />
              )}
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive flex items-center justify-between">
            <span>{errorMsg}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMsg(null)}
              className="size-7 p-0"
            >
              <IconX className="size-4" />
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <form
            id="edit-user-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* LEFT COLUMN: Data Profil (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IconUser className="size-4 text-primary" />
                    <span>Profil Karyawan</span>
                  </CardTitle>
                  <CardDescription>
                    ID Akun:{" "}
                    <span className="font-mono text-xs">{user?.id}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Username Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="user-username"
                      className="text-xs md:text-sm font-medium"
                    >
                      Nama Pengguna (Username){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="user-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isSubmitting}
                      autoComplete="username"
                      className="h-10 text-sm"
                    />
                  </div>

                  {/* Password Input (Optional) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="user-password"
                        className="text-xs md:text-sm font-medium"
                      >
                        Kata Sandi Baru (Opsional)
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Kosongkan jika tidak ingin mengubah
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        className="h-10 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <IconEyeOff className="size-4" />
                        ) : (
                          <IconEye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Role Selection Cards */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs md:text-sm font-medium">
                      Peran Akun (Role){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["CASHIER", "ADMIN", "OWNER"] as UserRole[]).map(
                        (r) => {
                          const cfg = ROLE_CONFIG[r];
                          const isSelected = role === r;

                          return (
                            <div
                              key={r}
                              onClick={() => setRole(r)}
                              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge
                                  variant="outline"
                                  className={`font-medium px-2 py-0.5 rounded-full text-xs ${cfg.badgeClass}`}
                                >
                                  {r}
                                </Badge>
                                {isSelected && (
                                  <IconCheck className="size-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {cfg.description}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Active Switch */}
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="user-status"
                        className="text-sm font-medium"
                      >
                        Status Akun Aktif
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Akun yang dinonaktifkan tidak dapat digunakan untuk
                        login POS kasir.
                      </p>
                    </div>
                    <Switch
                      id="user-status"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={isSubmitting}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Metadata (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <IconShield className="size-4 text-primary" />
                    <span>Informasi Akun</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div>
                    <span className="block font-medium text-foreground">
                      Terdaftar Pada:
                    </span>
                    <span>
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleString("id-ID")
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">
                      Terakhir Diperbarui:
                    </span>
                    <span>
                      {user?.updatedAt
                        ? new Date(user.updatedAt).toLocaleString("id-ID")
                        : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
