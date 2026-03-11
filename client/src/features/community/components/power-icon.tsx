import { Crown, Shield, Zap } from "lucide-react";

interface PowerIconProps {
  level: number;
}

export function PowerIcon({ level }: PowerIconProps) {
  switch (level) {
    case 5:
      return <Crown className="w-3.5 h-3.5 text-amber-400" />;
    case 4:
      return <Shield className="w-3.5 h-3.5 text-gray-400" />;
    case 3:
      return <Zap className="w-3.5 h-3.5 text-orange-400" />;
    default:
      return null;
  }
}