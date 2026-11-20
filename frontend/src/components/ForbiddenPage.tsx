import { IconShieldX, IconArrowLeft } from "@tabler/icons-react";
import { Link } from "react-router";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ForbiddenPage() {
  const { user } = useAuth();

  const roleLabel =
    user?.role === "OWNER"
      ? "Pemilik"
      : user?.role === "ADMIN"
        ? "Admin"
        : "Kasir";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in-50 duration-200">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <IconShieldX className="size-9" />
      </div>

      <Badge variant="destructive" className="mb-2">
        403 - Akses Ditolak
      </Badge>

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Halaman Tidak Diizinkan
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Akun Anda dengan peran{" "}
        <strong className="text-foreground">{roleLabel}</strong> tidak memiliki
        izin untuk mengakses halaman atau fitur ini.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link to="/dashboard" />}>
          <IconArrowLeft className="mr-2 size-4" />
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
}

export default ForbiddenPage;
