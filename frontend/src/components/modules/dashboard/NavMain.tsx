"use client";

import { useEffect, useState } from "react";
import { IconChevronRight, IconSearch } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { dashboardMenu } from "@/constants/dashboard-menu";

export function NavMain() {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const toggleMenu = (title: string) => {
    setOpenMenus((open) =>
      open.includes(title)
        ? open.filter((item) => item !== title)
        : [...open, title]
    );
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-4">
        <div className="relative px-2">
          <Button
            type="button"
            variant="outline"
            aria-label="Cari menu (⌘K)"
            onClick={() => setCommandOpen(true)}
            className="h-9 w-full justify-start gap-2 px-2 font-normal text-muted-foreground"
          >
            <IconSearch className="size-4" />
            <span className="flex-1 text-left">Cari menu...</span>
            <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>

        <CommandDialog
          open={commandOpen}
          onOpenChange={setCommandOpen}
          title="Cari menu"
          description="Cari dan buka halaman dashboard"
        >
          <Command>
            <CommandInput placeholder="Ketik nama menu..." />
            <CommandList>
              <CommandEmpty>Menu tidak ditemukan.</CommandEmpty>
              <CommandGroup heading="Navigasi">
                {dashboardMenu.flatMap((item) => {
                  const links = "items" in item ? item.items : [item];
                  const MenuIcon = item.icon;

                  return links.map((link) => (
                    <CommandItem
                      key={link.title}
                      value={link.title}
                      onSelect={() => {
                        navigate(link.url);
                        setCommandOpen(false);
                      }}
                    >
                      <MenuIcon />
                      <span>{link.title}</span>
                    </CommandItem>
                  ));
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>

        <div>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarMenu>
            {dashboardMenu.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={"url" in item && pathname === item.url}
                  onClick={
                    "items" in item ? () => toggleMenu(item.title) : undefined
                  }
                  render={"url" in item ? <a href={item.url} /> : undefined}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  {"items" in item && (
                    <IconChevronRight
                      className={`ml-auto transition-transform ${
                        openMenus.includes(item.title) ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </SidebarMenuButton>
                {"items" in item && openMenus.includes(item.title) && (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          isActive={pathname === subItem.url}
                          render={<a href={subItem.url} />}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
