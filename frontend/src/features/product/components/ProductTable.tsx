import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconPackageOff,
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
import { formatIDR, type ProductItem } from "../data/productData";

interface ProductTableProps {
  products: ProductItem[];
  onToggleStatus?: (productId: string) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (productId: string) => void;
}

export function ProductTable({
  products,
  onToggleStatus,
  onEditProduct,
  onDeleteProduct,
}: ProductTableProps) {
  return (
    <div className="px-4 md:px-6">
      <Card className="overflow-hidden p-0 ring-1 ring-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[300px]">Produk & SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-44 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconPackageOff className="size-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">
                        Tidak ada produk ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coba ubah kata kunci pencarian atau reset filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const isOutOfStock =
                    product.stock === 0 || !product.isAvailable;

                  return (
                    <TableRow key={product.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {product.name}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {product.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatIDR(product.price)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center text-xs font-medium ${
                            product.stock === 0
                              ? "text-red-600 dark:text-red-400"
                              : product.stock <= 20
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                          }`}
                        >
                          {product.stock} pcs
                        </span>
                      </TableCell>
                      <TableCell>
                        {!product.isActive ? (
                          <Badge variant="secondary" className="text-xs">
                            Nonaktif
                          </Badge>
                        ) : isOutOfStock ? (
                          <Badge variant="destructive" className="text-xs">
                            Habis
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            Tersedia
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
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => onEditProduct?.(product)}
                              className="gap-2 cursor-pointer"
                            >
                              <IconEdit className="size-4" />
                              <span>Edit Produk</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onToggleStatus?.(product.id)}
                              className="gap-2 cursor-pointer"
                            >
                              {product.isAvailable ? (
                                <>
                                  <IconToggleLeft className="size-4 text-amber-500" />
                                  <span>Tandai Habis</span>
                                </>
                              ) : (
                                <>
                                  <IconToggleRight className="size-4 text-emerald-500" />
                                  <span>Tandai Tersedia</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDeleteProduct?.(product.id)}
                              className="gap-2 cursor-pointer"
                            >
                              <IconTrash className="size-4" />
                              <span>Hapus</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <span>Menampilkan {products.length} produk</span>
          <span className="italic">District 13 Product Management</span>
        </div>
      </Card>
    </div>
  );
}
