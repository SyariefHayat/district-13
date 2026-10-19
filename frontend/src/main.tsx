import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/auth-context";
import { Toaster } from "./components/ui/toast";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Toaster>
        <RouterProvider router={router} />
      </Toaster>
    </AuthProvider>
  </StrictMode>
);
