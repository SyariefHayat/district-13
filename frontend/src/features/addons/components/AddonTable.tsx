import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconLayersOff,
  IconLink,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIDR, type AddonItem } from "../data/addonData";

interface AddonTableProps {
  addons: AddonItem[];
  onToggleStatus?: (addonId: string) => void;
  onEditAddon?: (addon: AddonItem) => void;
  onDeleteAddon?: (addonId: string) => void;
}

export function AddonTable({
  addons,
  onToggleStatus,
  onEditAddon,
  onDeleteAddon,
}: AddonTableProps) {
  return (
    <div className="px-4 md:px-6">
      <Card className="overflow-hidden p-0 ring-1 ring-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[300px]">
                  Nama Varian / Tambahan
                </TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Tambahan</TableHead>
                <TableHead>Terkait Menu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-44 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconLayersOff className="size-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">
                        Tidak ada varian ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba ubah kata kunci pencarian atau reset filter
                        kategori.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                addons.map((addon) => (
                  <TableRow key={addon.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {addon.name}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          ID: {addon.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {addon.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatIDR(addon.price)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <IconLink className="size-3.5 text-muted-foreground/70" />
                        <span>{addon.linkedProductsCount} produk</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {addon.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0"
                            >
                              <span className="sr-only">Buka menu</span>
                              <IconDotsVertical className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => onEditAddon?.(addon)}
                            className="gap-2 cursor-pointer"
                          >
                            <IconEdit className="size-4" />
                            <span>Edit Varian</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleStatus?.(addon.id)}
                            className="gap-2 cursor-pointer"
                          >
                            {addon.isActive ? (
                              <>
                                <IconToggleLeft className="size-4 text-amber-500" />
                                <span>Nonaktifkan</span>
                              </>
                            ) : (
                              <>
                                <IconToggleRight className="size-4 text-emerald-500" />
                                <span>Aktifkan</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDeleteAddon?.(addon.id)}
                            className="gap-2 cursor-pointer"
                          >
                            <IconTrash className="size-4" />
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <span>Menampilkan {addons.length} varian & tambahan</span>
          <span className="italic">District 13 Menu Customization</span>
        </div>
      </Card>
    </div>
  );
}
