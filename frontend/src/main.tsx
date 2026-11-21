import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/auth-context";
import { ConnectivityProvider } from "./context/connectivity-context";
import { Toaster } from "./components/ui/toast";
import "./index.css";
import { ThemeProvider } from "./context/theme-provider";
import { registerServiceWorker } from "./lib/pwa";
import { startOutboxSyncEngine } from "./lib/outbox-sync";

// Register Service Worker and initialize Outbox Sync Engine
registerServiceWorker();
startOutboxSyncEngine();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ConnectivityProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Toaster>
            <RouterProvider router={router} />
          </Toaster>
        </ThemeProvider>
      </ConnectivityProvider>
    </AuthProvider>
  </StrictMode>
);
