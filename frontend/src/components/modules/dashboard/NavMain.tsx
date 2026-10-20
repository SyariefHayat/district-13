"use client";

import { useState } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { useLocation } from "react-router";

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

import { MenuSearch } from "./MenuSearch";

export function NavMain() {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { pathname } = useLocation();

  const toggleMenu = (title: string) => {
    setOpenMenus((open) =>
      open.includes(title)
        ? open.filter((item) => item !== title)
        : [...open, title]
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-4">
        <div className="px-2">
          <MenuSearch />
        </div>
        <div>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarMenu>
            {dashboardMenu.map((item) => (
              <SidebarMenuItem key={item.title} className="mb-1">
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
