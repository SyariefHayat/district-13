import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./auth-context";

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="p-6 text-sm">Restoring session…</div>;
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  return <Outlet />;
}
