import { createBrowserRouter } from "react-router";
import { LoginPage } from "./features/auth";
import { OverviewPage } from "./features/overview";
import DashboardLayout from "./components/layouts/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: OverviewPage },

      // Reports & Financials
      { path: "reports", element: <div>Dashboard Reports</div> },
      { path: "discounts", element: <div>Dashboard Discounts</div> },
      { path: "audits", element: <div>Dashboard Audits</div> },
      { path: "profit", element: <div>Dashboard Profit</div> },

      // Payments & Transactions
      { path: "payments", element: <div>Dashboard Payments</div> },
      { path: "transactions", element: <div>Dashboard Transactions</div> },

      // Master Data & Management
      { path: "settings", element: <div>Dashboard Settings</div> },
      { path: "users", element: <div>Dashboard Users</div> },
      { path: "products", element: <div>Dashboard Products</div> },
      { path: "addons", element: <div>Dashboard Add-ons</div> },

      // Schedules & Shifts
      { path: "schedules", element: <div>Dashboard Schedules</div> },
      { path: "shifts", element: <div>Dashboard Shifts</div> },

      // Cashier & Cash Flow
      { path: "cash", element: <div>Dashboard Cash</div> },
      { path: "stocks", element: <div>Dashboard Stocks</div> },
      { path: "cashiers", element: <div>Dashboard Cashiers</div> },

      // Support
      { path: "help", element: <div>Dashboard Help</div> },
    ],
  },
  { path: "*", element: <div>Not Found</div> },
]);
