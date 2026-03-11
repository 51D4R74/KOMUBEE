import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { AuthForm } from "@/components/auth-form";
import { useState } from "react";
import { AppLoadingScreen } from "@/features/app-shell/loading-screen";
import type { AppView } from "@/features/app-shell/types";
import { AppViewRouter } from "@/features/app-shell/view-router";

function AppContent() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<AppView>({ type: "explore" });

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <AppViewRouter view={view} onNavigate={setView} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
