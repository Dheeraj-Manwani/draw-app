"use client";

import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./ui/tooltip";
import { Toaster } from "react-hot-toast";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              padding: "12px 16px",
              minWidth: "300px",
              maxWidth: "500px",
            },
            success: {
              style: {
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #9d00ff",
                boxShadow: "0 4px 14px 0 rgba(157, 0, 255, 0.15)",
                padding: "12px 16px",
                minWidth: "300px",
                maxWidth: "500px",
              },
              iconTheme: {
                primary: "#9d00ff",
                secondary: "white",
              },
            },
            error: {
              style: {
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #ef4444",
                boxShadow: "0 4px 14px 0 rgba(239, 68, 68, 0.15)",
                padding: "12px 16px",
                minWidth: "300px",
                maxWidth: "500px",
              },
              iconTheme: {
                primary: "#ef4444",
                secondary: "white",
              },
            },
          }}
        />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
};
