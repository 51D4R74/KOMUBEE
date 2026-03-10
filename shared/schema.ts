import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  bio: text("bio").default(""),
  avatarColor: text("avatar_color").default("#E63946"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  color: text("color").notNull().default("#E63946"),
  category: text("category").default("general"),
  founderId: varchar("founder_id").notNull(),
  entryType: text("entry_type").notNull().default("open"),
  heatScore: integer("heat_score").notNull().default(0),
  memberCount: integer("member_count").notNull().default(1),
  isPublic: boolean("is_public").notNull().default(true),
  gridX: real("grid_x").notNull().default(0),
  gridY: real("grid_y").notNull().default(0),
  coverImageUrl: text("cover_image_url"),
  relatedIds: text("related_ids").array().default(sql`'{}'::text[]`),
});

export const insertCommunitySchema = createInsertSchema(communities).pick({
  name: true,
  description: true,
  color: true,
  category: true,
  entryType: true,
  isPublic: true,
});

export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Community = typeof communities.$inferSelect;

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  userId: varchar("user_id").notNull(),
  powerLevel: integer("power_level").notNull().default(2),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).pick({
  communityId: true,
  userId: true,
  powerLevel: true,
});

export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;

export const threads = pgTable("threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  authorId: varchar("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").default(""),
  isPinned: boolean("is_pinned").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  messageCount: integer("message_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertThreadSchema = createInsertSchema(threads).pick({
  communityId: true,
  title: true,
  content: true,
});

export type InsertThread = z.infer<typeof insertThreadSchema>;
export type Thread = typeof threads.$inferSelect;

export const threadMessages = pgTable("thread_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertThreadMessageSchema = createInsertSchema(threadMessages).pick({
  threadId: true,
  content: true,
});

export type InsertThreadMessage = z.infer<typeof insertThreadMessageSchema>;
export type ThreadMessage = typeof threadMessages.$inferSelect;

export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  targetCount: integer("target_count").notNull().default(100),
  currentCount: integer("current_count").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMissionSchema = createInsertSchema(missions).pick({
  communityId: true,
  title: true,
  description: true,
  targetCount: true,
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

export const missionContributions = pgTable("mission_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionId: varchar("mission_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  amount: integer("amount").notNull().default(1),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMissionContributionSchema = createInsertSchema(missionContributions).pick({
  missionId: true,
  content: true,
  amount: true,
});

export type InsertMissionContribution = z.infer<typeof insertMissionContributionSchema>;
export type MissionContribution = typeof missionContributions.$inferSelect;

export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  question: text("question").notNull(),
  pollType: text("poll_type").notNull().default("multiple"),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPollSchema = createInsertSchema(polls).pick({
  communityId: true,
  question: true,
  pollType: true,
  isAnonymous: true,
});

export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;

export const pollOptions = pgTable("poll_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  text: text("text").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertPollOptionSchema = createInsertSchema(pollOptions).pick({
  pollId: true,
  text: true,
  orderIndex: true,
});

export type InsertPollOption = z.infer<typeof insertPollOptionSchema>;
export type PollOption = typeof pollOptions.$inferSelect;

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  optionId: varchar("option_id").notNull(),
  userId: varchar("user_id").notNull(),
  weight: integer("weight").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPollVoteSchema = createInsertSchema(pollVotes).pick({
  pollId: true,
  optionId: true,
});

export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;

export const arenas = pgTable("arenas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  proposition: text("proposition").notNull(),
  sideALabel: text("side_a_label").notNull().default("For"),
  sideBLabel: text("side_b_label").notNull().default("Against"),
  status: text("status").notNull().default("open"),
  turnDuration: integer("turn_duration").notNull().default(120),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArenaSchema = createInsertSchema(arenas).pick({
  communityId: true,
  proposition: true,
  sideALabel: true,
  sideBLabel: true,
  turnDuration: true,
});

export type InsertArena = z.infer<typeof insertArenaSchema>;
export type Arena = typeof arenas.$inferSelect;

export const arenaArguments = pgTable("arena_arguments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  arenaId: varchar("arena_id").notNull(),
  userId: varchar("user_id").notNull(),
  side: text("side").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArenaArgumentSchema = createInsertSchema(arenaArguments).pick({
  arenaId: true,
  side: true,
  content: true,
});

export type InsertArenaArgument = z.infer<typeof insertArenaArgumentSchema>;
export type ArenaArgument = typeof arenaArguments.$inferSelect;

export const arenaVotes = pgTable("arena_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  arenaId: varchar("arena_id").notNull(),
  userId: varchar("user_id").notNull(),
  side: text("side").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArenaVoteSchema = createInsertSchema(arenaVotes).pick({
  arenaId: true,
  side: true,
});

export type InsertArenaVote = z.infer<typeof insertArenaVoteSchema>;
export type ArenaVote = typeof arenaVotes.$inferSelect;

export const mosaics = pgTable("mosaics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  format: text("format").notNull().default("board"),
  rules: text("rules").default(""),
  isOpen: boolean("is_open").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMosaicSchema = createInsertSchema(mosaics).pick({
  communityId: true,
  title: true,
  description: true,
  format: true,
  rules: true,
});

export type InsertMosaic = z.infer<typeof insertMosaicSchema>;
export type Mosaic = typeof mosaics.$inferSelect;

export const mosaicPieces = pgTable("mosaic_pieces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mosaicId: varchar("mosaic_id").notNull(),
  userId: varchar("user_id").notNull(),
  pieceType: text("piece_type").notNull().default("text"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMosaicPieceSchema = createInsertSchema(mosaicPieces).pick({
  mosaicId: true,
  pieceType: true,
  content: true,
});

export type InsertMosaicPiece = z.infer<typeof insertMosaicPieceSchema>;
export type MosaicPiece = typeof mosaicPieces.$inferSelect;

export const fogueiras = pgTable("fogueiras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  creatorId: varchar("creator_id").notNull(),
  title: text("title").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  speakerCount: integer("speaker_count").notNull().default(0),
  listenerCount: integer("listener_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at"),
});

export const insertFogueiraSchema = createInsertSchema(fogueiras).pick({
  communityId: true,
  title: true,
});

export type InsertFogueira = z.infer<typeof insertFogueiraSchema>;
export type Fogueira = typeof fogueiras.$inferSelect;

export const fogueiraBrasas = pgTable("fogueira_brasas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fogueiraId: varchar("fogueira_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFogueiraBrasaSchema = createInsertSchema(fogueiraBrasas).pick({
  fogueiraId: true,
  content: true,
});

export type InsertFogueiraBrasa = z.infer<typeof insertFogueiraBrasaSchema>;
export type FogueiraBrasa = typeof fogueiraBrasas.$inferSelect;

export const POWER_LEVELS = {
  EXPLORER: 1,
  MEMBER: 2,
  CATALYST: 3,
  GUARDIAN: 4,
  FOUNDER: 5,
} as const;

export const POWER_LABELS: Record<number, string> = {
  1: "Explorer",
  2: "Member",
  3: "Catalyst",
  4: "Guardian",
  5: "Founder",
};

export const VOTE_WEIGHTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
};

export const CATEGORIES = [
  "general",
  "technology",
  "gaming",
  "music",
  "art",
  "science",
  "sports",
  "education",
  "health",
  "food",
  "travel",
  "finance",
  "books",
  "movies",
  "photography",
] as const;

export const COMMUNITY_COLORS = [
  "#E63946",
  "#F4A261",
  "#2A9D8F",
  "#264653",
  "#E76F51",
  "#606C38",
  "#9B5DE5",
  "#00BBF9",
  "#F15BB5",
  "#FEE440",
] as const;
