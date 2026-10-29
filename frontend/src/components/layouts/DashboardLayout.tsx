import * as React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { useAuth } from "@/context/auth-context";

import { AppSidebar } from "../modules/dashboard/AppSidebar";
import { SiteHeader } from "../modules/dashboard/SiteHeader";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo({ top: 0, left: 0 });
    document.body.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 63)",
          "--header-height": "calc(var(--spacing) * 13)",
        } as React.CSSProperties
      }
    >
      <ScrollRestoration />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader
          user={{
            name: user?.username ?? "Account",
            role: user?.role ?? "CASHIER",
            onLogout: () => void logout(),
          }}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
