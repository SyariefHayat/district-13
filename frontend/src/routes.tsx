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
import { DiscountPage } from "./features/discounts";
import { SchedulePage, AddSchedulePage } from "./features/schedules";
import { UserPage, AddUserPage, EditUserPage } from "./features/users";
import {
  WarehousePage,
  WarehouseMovementsPage,
  WarehouseRestockPage,
  WarehouseTransferPage,
} from "./features/warehouse";
import { SalesPage } from "./features/sales";
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
          { path: "reports", element: <div>Dashboard Reports</div> },
          { path: "discounts", Component: DiscountPage },
          { path: "audits", element: <div>Dashboard Audits</div> },
          { path: "profit", element: <div>Dashboard Profit</div> },

          // Payments & Transactions
          { path: "payments", element: <div>Dashboard Payments</div> },
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
          { path: "shifts", element: <div>Dashboard Shifts</div> },

          // Cashier & Cash Flow
          { path: "cash", element: <div>Dashboard Cash</div> },
          { path: "stocks", Component: WarehousePage },
          { path: "stocks/restock", Component: WarehouseRestockPage },
          { path: "stocks/transfer", Component: WarehouseTransferPage },
          { path: "stocks/movements", Component: WarehouseMovementsPage },
          { path: "warehouse", Component: WarehousePage },
          { path: "cashiers", element: <div>Dashboard Cashiers</div> },

          // Support
          { path: "help", element: <div>Dashboard Help</div> },
        ],
      },
    ],
  },
  { path: "*", element: <div>Not Found</div> },
]);
