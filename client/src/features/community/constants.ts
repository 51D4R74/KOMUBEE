import type { LucideIcon } from "lucide-react";
import { BarChart3, Flame, MessageCircle, Puzzle, Swords, Target } from "lucide-react";

import type { InteractionTab } from "./types";

export interface InteractionTabConfig {
  id: InteractionTab;
  label: string;
  icon: LucideIcon;
}

export const COMMUNITY_TABS: InteractionTabConfig[] = [
  { id: "colmeia", label: "Colmeia", icon: MessageCircle },
  { id: "fogueira", label: "Fogueira", icon: Flame },
  { id: "missao", label: "Missao", icon: Target },
  { id: "quiz", label: "Quiz", icon: BarChart3 },
  { id: "arena", label: "Arena", icon: Swords },
  { id: "mosaico", label: "Mosaico", icon: Puzzle },
];