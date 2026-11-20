import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth, type UserRole } from "./auth-context";
import { ForbiddenPage } from "@/components/ForbiddenPage";

export function RequireRole({
  allowedRoles,
}: {
  allowedRoles: readonly UserRole[];
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Memuat sesi…</div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
