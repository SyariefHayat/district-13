import {
  IconCreditCard,
  IconLock,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    role: string;
    onLogout: () => void;
    onLockSession?: () => void;
  };
}) {
  const roleLabel =
    user.role === "OWNER"
      ? "Pemilik"
      : user.role === "ADMIN"
        ? "Admin"
        : "Kasir";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
              <AvatarFallback>
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconUserCircle />
            Profil Akun
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconCreditCard />
            Langganan & Tagihan
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconNotification />
            Pemberitahuan
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.onLockSession &&
          (user.role === "OWNER" || user.role === "ADMIN") && (
            <DropdownMenuItem onClick={user.onLockSession}>
              <IconLock />
              Kunci Sesi
            </DropdownMenuItem>
          )}
        <DropdownMenuItem onClick={user.onLogout}>
          <IconLogout />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
