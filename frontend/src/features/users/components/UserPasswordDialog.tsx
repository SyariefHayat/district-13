import * as React from "react";
import { IconEye, IconEyeOff, IconKey, IconX } from "@tabler/icons-react";
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
import { Spinner } from "@/components/ui/spinner";
import type { UserItem } from "../data/userData";

interface UserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserItem | null;
  onSubmit: (userId: string, newPassword: string) => Promise<boolean>;
}

export function UserPasswordDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
}: UserPasswordDialogProps) {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMsg(null);
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!password || password.length < 8) {
      setErrorMsg("Kata sandi baru minimal 8 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await onSubmit(user.id, password);
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memperbarui kata sandi"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconKey className="size-5 text-primary" />
            <span>Ubah Kata Sandi Karyawan</span>
          </DialogTitle>
          <DialogDescription>
            Setel kata sandi baru untuk akun <strong>{user?.username}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form
          id="change-password-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-medium">
              Kata Sandi Baru
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                disabled={isSubmitting}
                autoComplete="new-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
            <Label htmlFor="confirm-password" className="text-xs font-medium">
              Konfirmasi Kata Sandi Baru
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                disabled={isSubmitting}
                autoComplete="new-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
        </form>

        <DialogFooter className="gap-2">
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
          <Button
            type="submit"
            form="change-password-form"
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <Spinner className="size-4" />
            ) : (
              <IconKey className="size-4" />
            )}
            <span>Simpan Sandi Baru</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
