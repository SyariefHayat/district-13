import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";
import { useAuth } from "@/context/auth-context";

import { AppSidebar } from "../modules/dashboard/AppSidebar";
import { SiteHeader } from "../modules/dashboard/SiteHeader";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        user={{
          name: user?.username ?? "Account",
          role: user?.role ?? "CASHIER",
          onLogout: () => void logout(),
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
