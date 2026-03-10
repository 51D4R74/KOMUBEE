import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Hexagon } from "lucide-react";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      if (isLogin) {
        await login.mutateAsync({ username: username.trim(), password });
      } else {
        await register.mutateAsync({ username: username.trim(), password });
      }
    } catch (err: any) {
      toast({
        title: isLogin ? "Login failed" : "Registration failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #E63946, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #F4A261, transparent)" }} />
      </div>

      <div className="relative w-full max-w-sm space-y-8" data-testid="auth-form-container">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Hexagon className="w-10 h-10 text-primary" strokeWidth={2} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-hex-pulse" />
              </div>
            </div>
          </div>
          <h1 className="font-headline text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Komubee
          </h1>
          <p className="text-muted-foreground text-sm">
            Communities first. People are important for what they create together.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm text-muted-foreground">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              data-testid="input-username"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="your_password"
              data-testid="input-password"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            data-testid="button-auth-submit"
          >
            {isPending ? "Please wait..." : isLogin ? "Enter the Hive" : "Create Account"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-auth-mode"
          >
            {isLogin
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
