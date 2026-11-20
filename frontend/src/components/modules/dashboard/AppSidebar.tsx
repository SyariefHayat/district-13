import * as React from "react";
import {
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
} from "@tabler/icons-react";

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

import { type RoleType } from "@/constants/dashboard-menu";

const footerItems: {
  title: string;
  url: string;
  icon: typeof IconSettings;
  roles?: readonly RoleType[];
}[] = [
  {
    title: "Pengaturan",
    url: "/dashboard/settings",
    icon: IconSettings,
    roles: ["OWNER", "ADMIN"],
  },
  { title: "Pusat Bantuan", url: "/dashboard/help", icon: IconHelp },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={
                <a href="#">
                  <IconInnerShadowTop className="size-5!" />
                  <span className="text-base font-semibold">Acme Inc.</span>
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
