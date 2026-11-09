import { useState } from "react";
import {
  IconShoppingCart,
  IconTrash,
  IconPlus,
  IconMinus,
  IconNote,
  IconCheck,
  IconAlertCircle,
  IconDiscount2,
  IconReceipt2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatIDR } from "@/features/product/data/productData";
import type { PosCartItem, PosDiscount } from "../types/posTypes";
import type { CashierShift } from "@/features/cashier/data/cashierData";

interface PosCartProps {
  cart: PosCartItem[];
  currentShift: CashierShift | null;
  discounts: PosDiscount[];
  selectedDiscount: PosDiscount | null;
  onSelectDiscount: (discount: PosDiscount | null) => void;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onUpdateNotes: (cartItemId: string, notes: string) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onCheckoutClick: () => void;
  cashierName: string;
}

export function PosCart({
  cart,
  currentShift,
  discounts,
  selectedDiscount,
  onSelectDiscount,
  subtotal,
  discountAmount,
  totalAmount,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  onCheckoutClick,
  cashierName,
}: PosCartProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>("");

  const isShiftOpen = Boolean(currentShift && !currentShift.closedAt);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const startEditNote = (item: PosCartItem) => {
    setEditingNoteId(item.cartItemId);
    setTempNote(item.notes);
  };

  const saveNote = (cartItemId: string) => {
    onUpdateNotes(cartItemId, tempNote);
    setEditingNoteId(null);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border bg-card shadow-xs overflow-hidden">
      {/* 1. Shift & Cashier Status Banner */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between text-xs border-b ${
          isShiftOpen
            ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 border-emerald-500/20"
            : "bg-amber-500/10 text-amber-950 dark:text-amber-200 border-amber-500/20"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`size-2 rounded-full ${
              isShiftOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span className="font-semibold">
            {isShiftOpen ? "Shift Kasir Aktif" : "Shift Belum Dibuka"}
          </span>
          <span className="text-muted-foreground">• {cashierName}</span>
        </div>

        {!isShiftOpen && (
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Perlu buka shift
          </span>
        )}
      </div>

      {/* 2. Cart Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconShoppingCart className="size-5 text-primary" />
          <h2 className="font-bold text-sm sm:text-base text-foreground">
            Keranjang Belanja
          </h2>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {totalItemCount} item
          </Badge>
        </div>

        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <IconTrash className="size-3.5" />
            <span>Kosongkan</span>
          </Button>
        )}
      </div>

      {/* 3. Items List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 text-muted-foreground">
            <div className="p-3.5 rounded-full bg-muted/60 mb-3 text-muted-foreground">
              <IconShoppingCart className="size-8 stroke-[1.5]" />
            </div>
            <p className="font-semibold text-sm text-foreground">
              Keranjang Masih Kosong
            </p>
            <p className="text-xs mt-1 max-w-[220px]">
              Pilih item dari katalog di sebelah kiri untuk menambahkan pesanan
              pelanggan.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const addonsTotal = item.selectedAddons.reduce(
              (sum, a) => sum + a.price,
              0
            );
            const lineUnitPrice = item.unitPrice + addonsTotal;
            const lineTotal = lineUnitPrice * item.quantity;
            const isEditingThisNote = editingNoteId === item.cartItemId;

            return (
              <div
                key={item.cartItemId}
                className="flex flex-col gap-2 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors text-xs"
              >
                {/* Item Top: Name, Price, Remove */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatIDR(item.unitPrice)}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    title="Hapus item"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>

                {/* Addons List */}
                {item.selectedAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.selectedAddons.map((addon) => (
                      <span
                        key={addon.id}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        +{addon.name} ({formatIDR(addon.price)})
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes Display / Editor */}
                {isEditingThisNote ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Catatan pesanan..."
                      className="h-7 text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveNote(item.cartItemId);
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => saveNote(item.cartItemId)}
                    >
                      <IconCheck className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                    {item.notes ? (
                      <span
                        onClick={() => startEditNote(item)}
                        className="italic truncate max-w-[180px] cursor-pointer hover:underline text-amber-600 dark:text-amber-400"
                        title="Klik untuk mengubah catatan"
                      >
                        Note: &ldquo;{item.notes}&rdquo;
                      </span>
                    ) : (
                      <button
                        onClick={() => startEditNote(item)}
                        className="text-[10px] text-muted-foreground/70 hover:text-primary flex items-center gap-1"
                      >
                        <IconNote className="size-3" />
                        <span>+ Catatan</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Item Bottom: Stepper & Line Total */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-6 rounded-md"
                      onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                    >
                      <IconMinus className="size-3" />
                    </Button>
                    <span className="w-6 text-center font-bold text-xs">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-6 rounded-md"
                      onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                      disabled={
                        item.displayStock > 0 &&
                        item.quantity >= item.displayStock
                      }
                    >
                      <IconPlus className="size-3" />
                    </Button>
                  </div>

                  <span className="font-bold text-foreground text-xs sm:text-sm">
                    {formatIDR(lineTotal)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Cart Summary & Calculations */}
      <div className="p-4 border-t bg-muted/20 flex flex-col gap-3">
        {/* Discount Selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconDiscount2 className="size-4 text-primary" />
            <span>Diskon:</span>
          </div>

          <div className="w-48">
            <Select
              value={selectedDiscount?.id || "NONE"}
              onValueChange={(val) => {
                if (val === "NONE") {
                  onSelectDiscount(null);
                } else {
                  const found = discounts.find((d) => d.id === val);
                  onSelectDiscount(found || null);
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pilih Diskon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs">
                  Tanpa Diskon
                </SelectItem>
                {discounts.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {d.name} (
                    {d.type === "percentage"
                      ? `${d.value}%`
                      : formatIDR(d.value)}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calculation Rows */}
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatIDR(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Potongan Diskon</span>
              <span>-{formatIDR(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t text-sm font-bold">
            <span className="text-foreground">Total Tagihan</span>
            <span className="text-lg font-black text-primary">
              {formatIDR(totalAmount)}
            </span>
          </div>
        </div>

        {/* 5. Checkout CTA */}
        {!isShiftOpen && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
            <IconAlertCircle className="size-4 shrink-0" />
            <span>
              Buka shift terlebih dahulu untuk memproses pembayaran kasir.
            </span>
          </div>
        )}

        <Button
          size="lg"
          onClick={onCheckoutClick}
          disabled={!isShiftOpen || cart.length === 0}
          className="w-full h-11 text-sm font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <IconReceipt2 className="size-5" />
          <span>Bayar {formatIDR(totalAmount)}</span>
        </Button>
      </div>
    </div>
  );
}
