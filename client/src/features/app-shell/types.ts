export type AppView =
  | { type: "explore" }
  | { type: "community"; communityId: string }
  | { type: "profile" };