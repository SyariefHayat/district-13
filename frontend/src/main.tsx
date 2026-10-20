import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/auth-context";
import { Toaster } from "./components/ui/toast";
import "./index.css";
import { ThemeProvider } from "./context/theme-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster>
          <RouterProvider router={router} />
        </Toaster>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
