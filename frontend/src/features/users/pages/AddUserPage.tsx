import * as React from "react";
import { useNavigate } from "react-router";
import {
  IconCheck,
  IconChevronLeft,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconShield,
  IconShieldLock,
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { ROLE_CONFIG, type UserRole } from "../data/userData";

export default function AddUserPage() {
  const navigate = useNavigate();
  const { authorizedFetch } = useAuth();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>("CASHIER");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setErrorMsg("Nama pengguna (username) wajib diisi");
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMsg("Nama pengguna minimal 3 karakter");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg("Kata sandi wajib minimal 8 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await authorizedFetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          password,
          role,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errDetail =
          body?.message || `Gagal menambah karyawan (${response.status})`;
        throw new Error(
          Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
        );
      }

      toast.add({
        title: "Karyawan berhasil dibuat",
        description: `Akun "${cleanUsername}" telah terdaftar sebagai ${role}.`,
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
                Tambah Karyawan
              </h1>
            </div>
          </div>

          {/* Action Buttons: Batal & Simpan */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => navigate("/dashboard/users")}
              className="gap-1.5"
            >
              <IconX className="size-4" />
              <span>Batal</span>
            </Button>
            <Button
              type="submit"
              form="add-user-form"
              disabled={isSubmitting}
              className="gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <Spinner className="size-4" />
              ) : (
                <IconCheck className="size-4" />
              )}
              <span>
                {isSubmitting ? "Menyimpan..." : "Buat Akun Karyawan"}
              </span>
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

        <form
          id="add-user-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* LEFT COLUMN: Data Utama (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IconUser className="size-4 text-primary" />
                  <span>Informasi Akun</span>
                </CardTitle>
                <CardDescription>
                  Masukkan kredensial login dan tentukan tingkat hak akses peran
                  staf.
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
                    placeholder="Contoh: kasir_pagi / staff_budi"
                    required
                    disabled={isSubmitting}
                    autoComplete="username"
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Minimal 3 karakter. Gunakan kombinasi huruf atau angka unik
                    tanpa spasi.
                  </p>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="user-password"
                      className="text-xs md:text-sm font-medium"
                    >
                      Kata Sandi <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        required
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm-password"
                      className="text-xs md:text-sm font-medium"
                    >
                      Konfirmasi Kata Sandi{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        required
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        className="h-10 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <IconEyeOff className="size-4" />
                        ) : (
                          <IconEye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role Selection Cards */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs md:text-sm font-medium">
                    Peran Akun (Role){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["CASHIER", "ADMIN", "OWNER"] as UserRole[]).map((r) => {
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
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Panduan & Info Keamanan (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <IconShield className="size-4 text-primary" />
                  <span>Hak Akses Peran</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>CASHIER</span>
                  </div>
                  <p>
                    Akses operasional POS kasir harian, pembukaan/penutupan
                    shift kasir, dan penerbitan transaksi penjualan.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span>ADMIN</span>
                  </div>
                  <p>
                    Manajemen katalog produk, stok inventori, riwayat mutasi,
                    laporan penjualan, dan audit operasional.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-purple-500" />
                    <span>OWNER</span>
                  </div>
                  <p>
                    Akses penuh tanpa batas, termasuk pembuatan akun staf,
                    konfigurasi toko, dan laporan keuangan komprehensif.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <IconShieldLock className="size-4 text-muted-foreground" />
                  <span>Keamanan Akun</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <IconInfoCircle className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Pastikan setiap staf kasir memiliki akun tersendiri untuk
                    menjaga integritas riwayat shift dan transaksi.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <IconInfoCircle className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Kata sandi langsung dienkripsi menggunakan Argon2id secara
                    aman di sisi server.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
