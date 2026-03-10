import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { AuthForm } from "@/components/auth-form";
import { ExplorePage } from "@/pages/explore-page";
import { CommunityPage } from "@/pages/community-page";
import { ProfilePage } from "@/pages/profile-page";
import { useState } from "react";
import { Hexagon } from "lucide-react";

type View = 
  | { type: "explore" }
  | { type: "community"; communityId: string }
  | { type: "profile" };

function AppContent() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<View>({ type: "explore" });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <Hexagon className="w-16 h-16 text-primary animate-hex-pulse" strokeWidth={1} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary animate-hex-pulse" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-headline">Loading Komubee...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {view.type === "explore" && (
        <ExplorePage
          onCommunityEnter={(id) => setView({ type: "community", communityId: id })}
          onProfileClick={() => setView({ type: "profile" })}
        />
      )}
      {view.type === "community" && (
        <CommunityPage
          communityId={view.communityId}
          onBack={() => setView({ type: "explore" })}
        />
      )}
      {view.type === "profile" && (
        <ProfilePage
          onBack={() => setView({ type: "explore" })}
          onCommunityClick={(id) => setView({ type: "community", communityId: id })}
        />
      )}
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
