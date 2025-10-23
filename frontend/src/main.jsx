import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import AppRoutes from "@/routes/AppRoutes";
import { UserProvider } from "@/context/UserContext";
import "@/App.css";
import { Toaster } from "sonner";
import { MatchingProvider } from "./context/MatchingContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster />
      <BrowserRouter>
        <UserProvider>
          <MatchingProvider>
            <AppRoutes />
          </MatchingProvider>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
