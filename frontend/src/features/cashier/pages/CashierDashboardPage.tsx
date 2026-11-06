import * as React from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "@/context/auth-context";
import { useCashierDashboard } from "../hooks/useCashierDashboard";
import { CashierHeader } from "../components/CashierHeader";
import { CashierStatsCards } from "../components/CashierStatsCards";
import { CashierShiftReconciliationCard } from "../components/CashierShiftReconciliationCard";
import { CashierRecentTransactions } from "../components/CashierRecentTransactions";
import { CashierQuickProductStock } from "../components/CashierQuickProductStock";
import { CashierScheduleCard } from "../components/CashierScheduleCard";
import { OpenShiftDialog } from "../components/OpenShiftDialog";
import { CloseShiftDialog } from "../components/CloseShiftDialog";
import { CashMovementDialog } from "../components/CashMovementDialog";
import { SaleDetailDialog } from "@/features/sales/components/SaleDetailDialog";
import type { SaleTransaction } from "@/features/sales/data/salesData";
import type { CashierTransaction } from "../data/cashierData";

export default function CashierDashboardPage() {
  const { user, authorizedFetch } = useAuth();
  const {
    currentShift,
    transactions,
    schedules,
    todaySchedule,
    products,
    isLoading,
    isRefreshing,
    error,
    metrics,
    refetch,
    openShift,
    closeShift,
    createCashMovement,
  } = useCashierDashboard();

  // Dialog states
  const [openShiftOpen, setOpenShiftOpen] = React.useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = React.useState(false);
  const [cashMovementOpen, setCashMovementOpen] = React.useState(false);

  // Detail dialog state
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<SaleTransaction | null>(
    null
  );

  const isShiftOpen = Boolean(currentShift && !currentShift.closedAt);

  const handleViewDetail = async (tx: CashierTransaction) => {
    // Map initial basic transaction
    const basic: SaleTransaction = {
      id: tx.id,
      transactionNumber: tx.transactionNumber,
      shiftId: tx.shiftId || "",
      userId: tx.userId,
      createdAt: tx.createdAt,
      status: tx.status,
      subtotalAmount: tx.subtotalAmount,
      discountAmount: tx.discountAmount,
      totalAmount: tx.totalAmount,
      paidAmount: tx.paidAmount,
      changeAmount: tx.changeAmount,
      paymentMethod: tx.paymentMethod as any,
      cashierName: tx.cashierName,
      items: [],
    };
    setSelectedTx(basic);
    setDetailOpen(true);

    // Fetch full details
    try {
      const res = await authorizedFetch(`/transactions/${tx.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedTx({
          ...basic,
          items: Array.isArray(full.items)
            ? full.items.map((i: any) => ({
                id: i.id || "",
                productId: i.productId || "",
                productName: i.productName || "Produk",
                categoryName: i.categoryName,
                quantity: Number(i.quantity || 1),
                unitPrice: Number(i.unitPrice || i.price || 0),
                subtotalPrice: Number(i.subtotalPrice || i.subtotal || 0),
                notes: i.notes,
              }))
            : [],
        });
      }
    } catch {
      // Keep basic info
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* 1. Header with Cashier Info & Shift Controls */}
      <CashierHeader
        cashierName={user?.username || "Kasir"}
        currentShift={currentShift}
        isRefreshing={isRefreshing}
        onRefresh={refetch}
        onOpenShiftClick={() => setOpenShiftOpen(true)}
        onCloseShiftClick={() => setCloseShiftOpen(true)}
        onCashMovementClick={() => setCashMovementOpen(true)}
      />

      {/* Error Notice */}
      {error && (
        <div className="mx-4 md:mx-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive flex items-center gap-2 text-xs">
          <IconAlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Key Metrics Cards */}
      <CashierStatsCards
        metrics={metrics}
        todaySchedule={todaySchedule}
        isLoading={isLoading}
      />

      {/* 3. Shift Reconciliation Breakdown */}
      <div className="px-4 lg:px-6">
        <CashierShiftReconciliationCard
          openingCash={metrics.openingCash}
          cashSales={metrics.cashSales}
          nonCashSales={metrics.nonCashSales}
          cashIn={metrics.cashIn}
          cashOut={metrics.cashOut}
          drawerCash={metrics.drawerCash}
          transactions={transactions}
          isShiftOpen={isShiftOpen}
          onOpenCashMovement={() => setCashMovementOpen(true)}
        />
      </div>

      {/* 4. Main Operational Grid: Recent Transactions & Sidebar Widgets */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        {/* Left 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2">
          <CashierRecentTransactions
            transactions={transactions}
            isLoading={isLoading}
            onViewDetail={handleViewDetail}
          />
        </div>

        {/* Right 1 Col: Quick Stock Lookup & Schedule */}
        <div className="flex flex-col gap-4">
          <CashierQuickProductStock products={products} isLoading={isLoading} />
          <CashierScheduleCard
            schedules={schedules}
            todaySchedule={todaySchedule}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Dialogs */}
      <OpenShiftDialog
        open={openShiftOpen}
        onOpenChange={setOpenShiftOpen}
        onConfirm={openShift}
      />

      <CloseShiftDialog
        open={closeShiftOpen}
        onOpenChange={setCloseShiftOpen}
        expectedCash={metrics.drawerCash}
        openingCash={metrics.openingCash}
        cashSales={metrics.cashSales}
        cashIn={metrics.cashIn}
        cashOut={metrics.cashOut}
        transactionCount={metrics.transactionCount}
        onConfirm={closeShift}
      />

      <CashMovementDialog
        open={cashMovementOpen}
        onOpenChange={setCashMovementOpen}
        onConfirm={createCashMovement}
      />

      <SaleDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        transaction={selectedTx}
      />
    </div>
  );
}
