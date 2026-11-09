import { useNavigate } from "react-router";
import {
  IconArrowLeft,
  IconRefresh,
  IconReceipt2,
  IconAlertCircle,
  IconDoorEnter,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { usePos } from "../hooks/usePos";
import { PosProductCatalog } from "../components/PosProductCatalog";
import { PosCart } from "../components/PosCart";
import { PosProductAddonDialog } from "../components/PosProductAddonDialog";
import { PosPaymentModal } from "../components/PosPaymentModal";
import { PosReceiptModal } from "../components/PosReceiptModal";

export default function PosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    cart,
    currentShift,
    discounts,
    selectedDiscount,
    setSelectedDiscount,
    subtotal,
    discountAmount,
    totalAmount,
    isLoading,
    isSubmitting,
    error,
    addonProduct,
    setAddonProduct,
    isPaymentOpen,
    setIsPaymentOpen,
    lastTransaction,
    isReceiptOpen,
    setIsReceiptOpen,
    addToCart,
    updateQuantity,
    updateNotes,
    removeFromCart,
    clearCart,
    handleProductCardClick,
    processCheckout,
    startNewTransaction,
    refreshPos,
  } = usePos();

  const isShiftOpen = Boolean(currentShift && !currentShift.closedAt);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 md:p-5 gap-3 max-w-[1700px] mx-auto w-full">
      {/* 1. POS Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/cashier")}
            className="size-9 rounded-lg"
            title="Kembali ke Dashboard Kasir"
          >
            <IconArrowLeft className="size-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <IconReceipt2 className="size-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Terminal Kasir POS</span>
                <Badge
                  variant="outline"
                  className="text-[10px] hidden sm:inline-flex bg-primary/5 text-primary border-primary/20"
                >
                  Live Checkout
                </Badge>
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Pilih menu pelanggan, kelola pesanan, dan proses transaksi
                pembayaran.
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: Shift Info & Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isShiftOpen ? (
            <Badge
              variant="outline"
              className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 py-1 px-2.5"
            >
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Shift Terbuka ({user?.username || "Kasir"})</span>
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/dashboard/cashier")}
              className="h-8 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 gap-1.5"
            >
              <IconDoorEnter className="size-3.5" />
              <span>Buka Shift di Kasir</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={refreshPos}
            className="size-8 rounded-lg"
            title="Segarkan Data Katalog & Shift"
          >
            <IconRefresh className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Error Alert Notice */}
      {error && (
        <div className="p-2.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 text-xs shrink-0">
          <IconAlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Main Two-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Product Catalog (7 or 8 columns on large screen) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0">
          <PosProductCatalog
            products={filteredProducts}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
            onProductClick={handleProductCardClick}
          />
        </div>

        {/* Right: Cart & Calculations (5 or 4 columns on large screen) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0">
          <PosCart
            cart={cart}
            currentShift={currentShift}
            discounts={discounts}
            selectedDiscount={selectedDiscount}
            onSelectDiscount={setSelectedDiscount}
            subtotal={subtotal}
            discountAmount={discountAmount}
            totalAmount={totalAmount}
            onUpdateQuantity={updateQuantity}
            onUpdateNotes={updateNotes}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCheckoutClick={() => setIsPaymentOpen(true)}
            cashierName={user?.username || "Kasir"}
          />
        </div>
      </div>

      {/* 3. Product Addon Customization Dialog */}
      <PosProductAddonDialog
        product={addonProduct}
        open={Boolean(addonProduct)}
        onOpenChange={(open) => !open && setAddonProduct(null)}
        onConfirm={(prod, selAddons, notes, qty) => {
          addToCart(prod, selAddons, notes, qty);
        }}
      />

      {/* 4. Payment Modal */}
      <PosPaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        totalAmount={totalAmount}
        isSubmitting={isSubmitting}
        onConfirmPayment={processCheckout}
      />

      {/* 5. Success Receipt Modal */}
      <PosReceiptModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        transaction={lastTransaction}
        onStartNewTransaction={startNewTransaction}
      />
    </div>
  );
}
