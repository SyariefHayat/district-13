import { IconBell } from "@tabler/icons-react";
import { useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { dashboardMenu } from "@/constants/dashboard-menu";

import { NavUser } from "./NavUser";
import { ModeToggle } from "./ModeToggle";
import { useConnectivity } from "@/context/connectivity-context";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

type SiteHeaderProps = {
  user: {
    name: string;
    role: string;
    onLogout: () => void;
    onLockSession?: () => void;
  };
};

export function SiteHeader({ user }: SiteHeaderProps) {
  const { pathname } = useLocation();
  const { isOffline, pendingSyncCount, isSyncing, syncNow } = useConnectivity();
  const directItem = dashboardMenu.find(
    (item) => "url" in item && item.url === pathname
  );
  const nestedItem = dashboardMenu.find(
    (item) =>
      "items" in item && item.items.some((subItem) => subItem.url === pathname)
  );
  const currentTitle =
    directItem?.title ??
    (nestedItem && "items" in nestedItem
      ? nestedItem.items.find((item) => item.url === pathname)?.title
      : undefined) ??
    pathname.split("/").filter(Boolean).at(-1) ??
    "Ringkasan";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b">
      <div className="flex w-full min-w-0 items-center gap-3 px-3 sm:px-4 lg:px-6">
        <SidebarTrigger className="shrink-0" />
        <Separator orientation="vertical" className="h-5 shrink-0 my-auto" />

        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {nestedItem && "items" in nestedItem && (
              <>
                <BreadcrumbItem className="hidden min-w-0 sm:inline-flex">
                  <span className="truncate">{nestedItem.title}</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
              </>
            )}
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">
                {currentTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Connectivity & Outbox Sync Status Badge (T-48, OFF-005) */}
          <div className="flex items-center gap-1.5">
            {isOffline ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                <WifiOff className="size-3" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                <Wifi className="size-3" />
                <span className="hidden sm:inline">Online</span>
              </span>
            )}

            {pendingSyncCount > 0 && (
              <button
                onClick={() => syncNow()}
                disabled={isSyncing || isOffline}
                title="Klik untuk menyinkronkan sekarang"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3 ${isSyncing ? "animate-spin" : ""}`}
                />
                <span>{pendingSyncCount}</span>
                <span className="hidden md:inline">pending</span>
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Buka notifikasi"
                  className="shrink-0 relative"
                >
                  <IconBell className="size-4.5" />
                  <span
                    aria-hidden="true"
                    className="absolute top-0 right-0 flex size-2"
                  >
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-300 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-red-400" />
                  </span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-72" sideOffset={8}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-medium">Tidak ada notifikasi</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Notifikasi terbaru akan muncul di sini.
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
          <Separator
            orientation="vertical"
            className="h-5 shrink-0 my-auto mr-2"
          />
          <NavUser user={user} />
        </div>
      </div>
    </header>
  );
}
