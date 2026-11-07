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
import { AdminDashboardPage } from "./features/admin";
import DashboardLayout from "./components/layouts/DashboardLayout";
import { RequireAuth } from "./context/RequireAuth";

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
          { index: true, Component: OverviewPage },

          // Reports & Financials
          { path: "reports", Component: SalesReportPage },
          { path: "discounts", Component: DiscountPage },
          { path: "discounts/new", Component: AddDiscountPage },
          { path: "discounts/:id/edit", Component: AddDiscountPage },
          { path: "cashiers", Component: CashierAuditPage },
          { path: "profit", Component: ProfitReportPage },
          { path: "audits", Component: AuditLogPage },

          // Payments & Transactions
          { path: "payments", Component: PaymentPage },
          { path: "payments/new", Component: AddPaymentPage },
          { path: "payments/:id/edit", Component: AddPaymentPage },
          { path: "transactions", Component: SalesPage },
          { path: "sales", Component: SalesPage },

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

          // Schedules & Shifts
          { path: "schedules", Component: SchedulePage },
          { path: "schedules/new", Component: AddSchedulePage },
          { path: "shifts", Component: ShiftReportPage },

          // Cashier & Cash Flow
          { path: "cash", Component: CashReportPage },
          { path: "stocks", Component: WarehousePage },
          { path: "stocks/restock", Component: WarehouseRestockPage },
          { path: "stocks/transfer", Component: WarehouseTransferPage },
          { path: "stocks/movements", Component: WarehouseMovementsPage },
          { path: "warehouse", Component: WarehousePage },
          { path: "cashier", Component: CashierDashboardPage },
          { path: "admin", Component: AdminDashboardPage },

          // Support
          { path: "help", element: <div>Dashboard Help</div> },
        ],
      },
    ],
  },
  { path: "*", element: <div>Not Found</div> },
]);
