import * as React from "react";
import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { type RoleType } from "@/constants/dashboard-menu";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
    roles?: readonly RoleType[];
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { user } = useAuth();
  const userRole = user?.role ?? "CASHIER";

  const visibleItems = items.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
