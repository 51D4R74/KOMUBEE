import { Hexagon } from "lucide-react";

export function AppLoadingScreen() {
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