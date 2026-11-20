import { createBrowserRouter } from "react-router";
import { LoginPage } from "./features/auth";
import { OverviewPage } from "./features/overview";
import {
  ProductPage,
  AddProductPage,
  EditPage,
  ProductDetailPage,
} from "./features/product";
import { AddonPage } from "./features/addons";
import { DiscountPage, AddDiscountPage } from "./features/discounts";
import { SchedulePage, AddSchedulePage } from "./features/schedules";
import { UserPage, AddUserPage, EditUserPage } from "./features/users";
import {
  WarehousePage,
  WarehouseMovementsPage,
  WarehouseRestockPage,
  WarehouseTransferPage,
} from "./features/warehouse";
import { SalesPage } from "./features/sales";
import {
  SalesReportPage,
  ShiftReportPage,
  CashReportPage,
  ProfitReportPage,
  CashierAuditPage,
  AuditLogPage,
} from "./features/reports";
import { PaymentPage, AddPaymentPage } from "./features/payments";
import { CashierDashboardPage } from "./features/cashier";
import { PosPage } from "./features/pos";
import { AdminDashboardPage } from "./features/admin";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { RequireAuth } from "./context/RequireAuth";
import { RequireRole } from "./context/RequireRole";
import { ForbiddenPage } from "./components/ForbiddenPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/dashboard",
        Component: DashboardLayout,
        children: [
          // Common routes for all authenticated users
          { index: true, Component: OverviewPage },
          { path: "schedules", Component: SchedulePage },
          { path: "schedules/new", Component: AddSchedulePage },
          { path: "transactions", Component: SalesPage },
          { path: "sales", Component: SalesPage },
          { path: "help", element: <div>Dashboard Help</div> },
          { path: "forbidden", Component: ForbiddenPage },

          // Cashier POS routes (Pemilik/Admin ditolak membuat transaksi - USR-006)
          {
            element: <RequireRole allowedRoles={["CASHIER"]} />,
            children: [
              { path: "pos", Component: PosPage },
              { path: "cashier/pos", Component: PosPage },
              { path: "cashier", Component: CashierDashboardPage },
            ],
          },

          // Owner-only reports (Laporan profit hanya untuk Pemilik)
          {
            element: <RequireRole allowedRoles={["OWNER"]} />,
            children: [{ path: "profit", Component: ProfitReportPage }],
          },

          // Owner & Admin routes
          {
            element: <RequireRole allowedRoles={["OWNER", "ADMIN"]} />,
            children: [
              // Reports & Audits
              { path: "reports", Component: SalesReportPage },
              { path: "shifts", Component: ShiftReportPage },
              { path: "cash", Component: CashReportPage },
              { path: "cashiers", Component: CashierAuditPage },
              { path: "audits", Component: AuditLogPage },

              // Master Data & Management
              { path: "settings", element: <div>Dashboard Settings</div> },
              { path: "users", Component: UserPage },
              { path: "users/new", Component: AddUserPage },
              { path: "users/:id/edit", Component: EditUserPage },
              { path: "products", Component: ProductPage },
              { path: "products/new", Component: AddProductPage },
              { path: "products/edit", Component: EditPage },
              { path: "products/:id/edit", Component: EditPage },
              { path: "products/:id", Component: ProductDetailPage },
              { path: "addons", Component: AddonPage },
              { path: "discounts", Component: DiscountPage },
              { path: "discounts/new", Component: AddDiscountPage },
              { path: "discounts/:id/edit", Component: AddDiscountPage },
              { path: "payments", Component: PaymentPage },
              { path: "payments/new", Component: AddPaymentPage },
              { path: "payments/:id/edit", Component: AddPaymentPage },

              // Inventory & Stocks
              { path: "stocks", Component: WarehousePage },
              { path: "stocks/restock", Component: WarehouseRestockPage },
              { path: "stocks/transfer", Component: WarehouseTransferPage },
              { path: "stocks/movements", Component: WarehouseMovementsPage },
              { path: "warehouse", Component: WarehousePage },
              { path: "admin", Component: AdminDashboardPage },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <div>Not Found</div> },
]);
