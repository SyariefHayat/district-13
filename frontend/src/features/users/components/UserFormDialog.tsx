import * as React from "react";
import { IconCheck, IconEye, IconEyeOff, IconX } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_CONFIG, type UserItem, type UserRole } from "../data/userData";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserItem | null;
  onSubmit: (values: {
    username: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
  }) => Promise<boolean>;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
}: UserFormDialogProps) {
  const isEditing = Boolean(user);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>("CASHIER");
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setUsername(user.username);
      setPassword("");
      setRole(user.role);
      setIsActive(user.isActive);
    } else {
      setUsername("");
      setPassword("");
      setRole("CASHIER");
      setIsActive(true);
    }
    setShowPassword(false);
    setErrorMsg(null);
  }, [user, open]);

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

    if (!isEditing && (!password || password.length < 8)) {
      setErrorMsg("Kata sandi wajib diisi minimal 8 karakter");
      return;
    }

    if (isEditing && password && password.length < 8) {
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

      const success = await onSubmit(payload);
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan akun karyawan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Ubah Data Karyawan" : "Tambah Karyawan Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi akun, hak akses peran, atau setel ulang kata sandi."
              : "Daftarkan akun staf baru dan tentukan hak akses peran operasionalnya."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="user-username" className="text-xs font-medium">
              Nama Pengguna (Username)
            </Label>
            <Input
              id="user-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: kasir_pagi / staff_budi"
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="user-password" className="text-xs font-medium">
                {isEditing ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"}
              </Label>
              {isEditing && (
                <span className="text-[11px] text-muted-foreground">
                  Kosongkan jika tidak diubah
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isEditing
                    ? "Masukkan sandi baru (min. 8 karakter)"
                    : "Minimal 8 karakter"
                }
                disabled={isSubmitting}
                autoComplete={isEditing ? "new-password" : "current-password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

          <div className="space-y-1.5">
            <Label htmlFor="user-role" className="text-xs font-medium">
              Peran Akun (Role)
            </Label>
            <Select
              value={role}
              onValueChange={(val) => {
                if (val) setRole(val as UserRole);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["CASHIER", "ADMIN", "OWNER"] as UserRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex flex-col text-left py-0.5">
                      <span className="font-medium text-xs">
                        {ROLE_CONFIG[r].label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {ROLE_CONFIG[r].description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="user-status" className="text-xs font-medium">
                Status Akun Aktif
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Akun yang dinonaktifkan tidak dapat login ke sistem kasir.
              </p>
            </div>
            <Switch
              id="user-status"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <IconX className="size-4" />
              <span>Batal</span>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <Spinner className="size-4" />
              ) : (
                <IconCheck className="size-4" />
              )}
              <span>{isEditing ? "Simpan Perubahan" : "Buat Akun"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
