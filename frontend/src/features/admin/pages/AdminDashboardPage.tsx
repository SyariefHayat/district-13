import * as React from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "@/context/auth-context";
import { SaleDetailDialog } from "@/features/sales/components/SaleDetailDialog";
import { VoidSaleDialog } from "@/features/sales/components/VoidSaleDialog";
import type { SaleTransaction } from "@/features/sales/data/salesData";
import { WarehouseTransferDialog } from "@/features/warehouse/components/WarehouseTransferDialog";
import type { WarehouseInventoryItem } from "@/features/warehouse/data/warehouseData";
import { AdminActiveShiftsCard } from "../components/AdminActiveShiftsCard";
import { AdminCashMovementDialog } from "../components/AdminCashMovementDialog";
import { AdminCloseShiftDialog } from "../components/AdminCloseShiftDialog";
import { AdminHeader } from "../components/AdminHeader";
import { AdminLowStockCard } from "../components/AdminLowStockCard";
import { AdminRecentTransactionsCard } from "../components/AdminRecentTransactionsCard";
import { AdminScheduleAndTrafficCard } from "../components/AdminScheduleAndTrafficCard";
import { AdminStatsCards } from "../components/AdminStatsCards";
import type {
  AdminActiveShift,
  AdminLowStockItem,
  AdminTransaction,
} from "../data/adminData";
import { useAdminDashboard } from "../hooks/useAdminDashboard";

export default function AdminDashboardPage() {
  const { user, authorizedFetch } = useAuth();
  const {
    metrics,
    activeShifts,
    lowStockItems,
    warehouseItems,
    recentTransactions,
    todaySchedules,
    hourlyTraffic,
    isLoading,
    isRefreshing,
    error,
    refetch,
    createCashMovement,
    forceCloseShift,
    transferToDisplay,
    voidTransaction,
  } = useAdminDashboard();

  // Dialog States
  const [cashMovementOpen, setCashMovementOpen] = React.useState(false);
  const [selectedShiftForCash, setSelectedShiftForCash] = React.useState<
    string | null
  >(null);

  const [closeShiftOpen, setCloseShiftOpen] = React.useState(false);
  const [selectedShiftToClose, setSelectedShiftToClose] =
    React.useState<AdminActiveShift | null>(null);

  const [transferOpen, setTransferOpen] = React.useState(false);
  const [selectedItemForTransfer, setSelectedItemForTransfer] =
    React.useState<WarehouseInventoryItem | null>(null);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedTx, setSelectedTx] = React.useState<SaleTransaction | null>(
    null
  );

  const [voidOpen, setVoidOpen] = React.useState(false);
  const [selectedTxToVoid, setSelectedTxToVoid] =
    React.useState<SaleTransaction | null>(null);

  // Trigger Cash Movement from Header or Shift Card
  const handleOpenCashMovement = (shift?: AdminActiveShift) => {
    setSelectedShiftForCash(shift?.id || null);
    setCashMovementOpen(true);
  };

  // Trigger Close Shift
  const handleOpenCloseShift = (shift: AdminActiveShift) => {
    setSelectedShiftToClose(shift);
    setCloseShiftOpen(true);
  };

  // Trigger Transfer from Low Stock Card
  const handleOpenTransfer = (item?: AdminLowStockItem) => {
    if (item) {
      const match = warehouseItems.find((w) => w.productId === item.productId);
      setSelectedItemForTransfer(
        match || {
          id: item.id,
          productId: item.productId,
          name: item.name,
          sku: "",
          category: item.category,
          warehouseStock: item.warehouseStock,
          displayStock: item.displayStock,
          totalStock: item.displayStock + item.warehouseStock,
          minStockThreshold: item.minStockThreshold,
          costPrice: 0,
          sellingPrice: 0,
          updatedAt: new Date().toISOString(),
        }
      );
    } else {
      setSelectedItemForTransfer(null);
    }
    setTransferOpen(true);
  };

  // View Transaction Detail
  const handleViewDetail = async (tx: AdminTransaction) => {
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
      // Keep basic data
    }
  };

  // Trigger Void Modal
  const handleOpenVoid = (tx: AdminTransaction | SaleTransaction) => {
    const toVoid: SaleTransaction = {
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
      items: "items" in tx ? tx.items : [],
    };
    setSelectedTxToVoid(toVoid);
    setVoidOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* 1. Header with Operational Status and Quick Actions */}
      <AdminHeader
        adminName={user?.username || "Admin"}
        activeShiftsCount={metrics.activeShiftsCount}
        lowStockCount={metrics.lowStockCount}
        isRefreshing={isRefreshing}
        onRefresh={refetch}
        onOpenCashMovement={() => handleOpenCashMovement()}
        onOpenTransfer={() => handleOpenTransfer()}
      />

      {/* Error Alert Banner */}
      {error && (
        <div className="mx-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive lg:mx-6">
          <IconAlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Operational Metrics Cards */}
      <AdminStatsCards metrics={metrics} isLoading={isLoading} />

      {/* 3. Cashier Shifts Supervision */}
      <div className="px-4 lg:px-6">
        <AdminActiveShiftsCard
          shifts={activeShifts}
          isLoading={isLoading}
          onOpenCashMovement={handleOpenCashMovement}
          onCloseShift={handleOpenCloseShift}
        />
      </div>

      {/* 4. Display Stock Alerts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <AdminLowStockCard
          items={lowStockItems}
          isLoading={isLoading}
          onTransferClick={handleOpenTransfer}
        />
        <AdminRecentTransactionsCard
          transactions={recentTransactions}
          isLoading={isLoading}
          onViewDetail={handleViewDetail}
          onVoidClick={handleOpenVoid}
        />
      </div>

      {/* 5. Today's Schedules & Hourly Traffic */}
      <div className="px-4 lg:px-6">
        <AdminScheduleAndTrafficCard
          schedules={todaySchedules}
          hourlyTraffic={hourlyTraffic}
          isLoading={isLoading}
        />
      </div>

      {/* Dialogs */}
      {/* 1. Cash Movement Dialog */}
      <AdminCashMovementDialog
        open={cashMovementOpen}
        onOpenChange={setCashMovementOpen}
        activeShifts={activeShifts}
        defaultShiftId={selectedShiftForCash}
        onSubmit={createCashMovement}
      />

      {/* 2. Close Shift Override Dialog */}
      <AdminCloseShiftDialog
        open={closeShiftOpen}
        onOpenChange={setCloseShiftOpen}
        shift={selectedShiftToClose}
        onConfirm={forceCloseShift}
      />

      {/* 3. Warehouse Transfer to Display Dialog */}
      <WarehouseTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        items={warehouseItems}
        selectedItem={selectedItemForTransfer}
        onTransfer={transferToDisplay}
      />

      {/* 4. Transaction Detail Dialog */}
      <SaleDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        transaction={selectedTx}
        onVoidClick={(tx) => {
          setDetailOpen(false);
          handleOpenVoid(tx);
        }}
      />

      {/* 5. Void Transaction Dialog */}
      <VoidSaleDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        transaction={selectedTxToVoid}
        onConfirm={voidTransaction}
      />
    </div>
  );
}
