import * as React from "react";
import { IconHelp, IconSettings } from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavMain } from "./NavMain";
import { NavSecondary } from "./NavSecondary";

const footerItems = [
  { title: "Pengaturan", url: "/dashboard/settings", icon: IconSettings },
  { title: "Pusat Bantuan", url: "/dashboard/help", icon: IconHelp },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-center cursor-pointer hover:bg-transparent active:bg-transparent data-[slot=sidebar-menu-button]:p-1.5! mt-5 mb-3"
              render={
                <a href="#">
                  <img
                    src="/logo/logo.png"
                    alt="District 13"
                    className="h-8 w-auto object-contain"
                  />
                </a>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={footerItems} />
      </SidebarFooter>
    </Sidebar>
  );
}
