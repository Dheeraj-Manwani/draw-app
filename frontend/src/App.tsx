import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClerkProvider } from "@clerk/clerk-react";
import { HelmetProvider } from "react-helmet-async";
import Home from "@/pages/home";
import Drawing from "@/pages/drawing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Drawing} />
      <Route path="/home" component={Drawing} />
      <Route path="/drawing/:id" component={Drawing} />
      <Route component={Drawing} />
    </Switch>
  );
}

function App() {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <HelmetProvider>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <Router />
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
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </HelmetProvider>
  );
}

export default App;
