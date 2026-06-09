import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { ToastProvider } from "./components/Toasts";
import { TooltipProvider } from "./components/ui/tooltip";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);
