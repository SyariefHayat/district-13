import { useEffect, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { useNavigate } from "react-router";

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
import { dashboardMenu } from "@/constants/dashboard-menu";

export function MenuSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label="Cari menu (⌘K)"
        onClick={() => setOpen(true)}
        className="h-9 w-full justify-start gap-2 px-2 font-normal text-muted-foreground"
      >
        <IconSearch className="size-4" />
        <span className="flex-1 text-left">Cari menu...</span>
        <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
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
                      setOpen(false);
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
    </>
  );
}
