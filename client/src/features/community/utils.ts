import type { Thread } from "@shared/schema";

export function isThreadStale(thread: Thread) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return new Date(thread.lastActivityAt) < sevenDaysAgo;
}

export function getPowerLevelTextColor(powerLevel: number) {
  return powerLevel === 5 ? "#F4A261" : "hsl(0, 0%, 88%)";
}