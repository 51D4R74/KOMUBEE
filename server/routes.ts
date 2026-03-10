import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { POWER_LEVELS, VOTE_WEIGHTS } from "@shared/schema";
import { z } from "zod";

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/communities", async (_req, res, next) => {
    try {
      const communities = await storage.getAllCommunities();
      res.json(communities);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/mine/ids", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const ids = await storage.getUserMemberCommunityIds(userId);
      res.json(ids);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id", async (req, res, next) => {
    try {
      const community = await storage.getCommunity(req.params.id);
      if (!community) return res.status(404).json({ message: "Community not found" });
      res.json(community);
    } catch (err) {
      next(err);
    }
  });

  const createCommunitySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().default(""),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#E63946"),
    category: z.string().optional().default("general"),
    entryType: z.enum(["open", "question", "invite", "challenge", "approval"]).optional().default("open"),
    isPublic: z.boolean().optional().default(true),
  });

  app.post("/api/communities", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const parsed = createCommunitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const community = await storage.createCommunity({ ...parsed.data, founderId: userId });
      await storage.joinCommunity(community.id, userId, POWER_LEVELS.FOUNDER);
      res.json(community);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/communities/:id/join", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const communityId = req.params.id;
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });
      const existing = await storage.getMembership(communityId, userId);
      if (existing) return res.json(existing);
      const member = await storage.joinCommunity(communityId, userId);
      res.json(member);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id/members", requireAuth, async (req, res, next) => {
    try {
      const members = await storage.getCommunityMembers(req.params.id);
      const safeMembersList = members.map((m) => ({
        ...m,
        user: { ...m.user, password: undefined },
      }));
      res.json(safeMembersList);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id/threads", requireAuth, async (req, res, next) => {
    try {
      const threadsList = await storage.getThreads(req.params.id);
      res.json(threadsList);
    } catch (err) {
      next(err);
    }
  });

  const createThreadSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().max(2000).optional().default(""),
  });

  app.post("/api/communities/:id/threads", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const communityId = req.params.id;
      const parsed = createThreadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const membership = await storage.getMembership(communityId, userId);
      if (!membership || membership.powerLevel < POWER_LEVELS.MEMBER) {
        return res.status(403).json({ message: "You must be a member to create threads" });
      }
      const thread = await storage.createThread({
        communityId,
        authorId: userId,
        title: parsed.data.title,
        content: parsed.data.content,
      });
      res.json(thread);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/threads/:id/pin", requireAuth, async (req, res, next) => {
    try {
      const thread = await storage.toggleThreadPin(req.params.id);
      res.json(thread);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/threads/:id/archive", requireAuth, async (req, res, next) => {
    try {
      const thread = await storage.archiveThread(req.params.id);
      res.json(thread);
    } catch (err) {
      next(err);
    }
  });

  const createMessageSchema = z.object({
    content: z.string().min(1).max(5000),
  });

  app.get("/api/threads/:id/messages", requireAuth, async (req, res, next) => {
    try {
      const msgs = await storage.getMessages(req.params.id);
      const safeMsgs = msgs.map((m) => ({
        ...m,
        author: { ...m.author, password: undefined },
      }));
      res.json(safeMsgs);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/threads/:id/messages", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const threadId = req.params.id;
      const parsed = createMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const message = await storage.createMessage({
        threadId,
        authorId: userId,
        content: parsed.data.content,
      });
      res.json(message);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/user/communities", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const result = await storage.getUserCommunities(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id/missions", requireAuth, async (req, res, next) => {
    try {
      const missionsList = await storage.getMissions(req.params.id);
      res.json(missionsList);
    } catch (err) {
      next(err);
    }
  });

  const createMissionSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional().default(""),
    targetCount: z.number().int().min(1).max(100000),
  });

  app.post("/api/communities/:id/missions", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const communityId = req.params.id;
      const parsed = createMissionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const membership = await storage.getMembership(communityId, userId);
      if (!membership || membership.powerLevel < POWER_LEVELS.CATALYST) {
        return res.status(403).json({ message: "Catalyst+ required to create missions" });
      }
      const mission = await storage.createMission({ ...parsed.data, communityId, creatorId: userId });
      res.json(mission);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/missions/:id/contributions", requireAuth, async (req, res, next) => {
    try {
      const contribs = await storage.getMissionContributions(req.params.id);
      res.json(contribs.map((c) => ({ ...c, user: { ...c.user, password: undefined } })));
    } catch (err) {
      next(err);
    }
  });

  const createContributionSchema = z.object({
    content: z.string().min(1).max(500),
    amount: z.number().int().min(1).max(1000).optional().default(1),
  });

  app.post("/api/missions/:id/contributions", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const parsed = createContributionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const mission = await storage.getMission(req.params.id);
      if (!mission) return res.status(404).json({ message: "Mission not found" });
      if (mission.isCompleted) return res.status(400).json({ message: "Mission already completed" });
      const membership = await storage.getMembership(mission.communityId, userId);
      if (!membership) return res.status(403).json({ message: "Not a member" });
      const contrib = await storage.createMissionContribution({
        missionId: req.params.id,
        userId,
        content: parsed.data.content,
        amount: parsed.data.amount,
      });
      res.json(contrib);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id/polls", requireAuth, async (req, res, next) => {
    try {
      const pollsList = await storage.getPolls(req.params.id);
      res.json(pollsList);
    } catch (err) {
      next(err);
    }
  });

  const createPollSchema = z.object({
    question: z.string().min(1).max(500),
    pollType: z.enum(["multiple", "yesno"]).optional().default("multiple"),
    isAnonymous: z.boolean().optional().default(true),
    options: z.array(z.string().min(1).max(200)).min(2).max(10),
  });

  app.post("/api/communities/:id/polls", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const communityId = req.params.id;
      const parsed = createPollSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const membership = await storage.getMembership(communityId, userId);
      if (!membership || membership.powerLevel < POWER_LEVELS.MEMBER) {
        return res.status(403).json({ message: "Members+ required" });
      }
      const poll = await storage.createPoll(
        { communityId, creatorId: userId, question: parsed.data.question, pollType: parsed.data.pollType, isAnonymous: parsed.data.isAnonymous },
        parsed.data.options
      );
      res.json(poll);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/polls/:id/options", requireAuth, async (req, res, next) => {
    try {
      const options = await storage.getPollOptions(req.params.id);
      res.json(options);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/polls/:id/votes", requireAuth, async (req, res, next) => {
    try {
      const votes = await storage.getPollVotes(req.params.id);
      res.json(votes);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/polls/:id/vote", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const pollId = req.params.id;
      const parsed = z.object({ optionId: z.string().min(1) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid option" });
      const poll = await storage.getPoll(pollId);
      if (!poll || !poll.isActive) return res.status(400).json({ message: "Poll is closed" });
      const membership = await storage.getMembership(poll.communityId, userId);
      if (!membership) return res.status(403).json({ message: "Not a member" });
      const weight = VOTE_WEIGHTS[membership.powerLevel] || 1;
      const vote = await storage.castPollVote({ pollId, optionId: parsed.data.optionId, userId, weight });
      res.json(vote);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/polls/:id/close", requireAuth, async (req, res, next) => {
    try {
      const poll = await storage.closePoll(req.params.id);
      res.json(poll);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id/arenas", requireAuth, async (req, res, next) => {
    try {
      const arenasList = await storage.getArenas(req.params.id);
      res.json(arenasList);
    } catch (err) {
      next(err);
    }
  });

  const createArenaSchema = z.object({
    proposition: z.string().min(1).max(500),
    sideALabel: z.string().min(1).max(100).optional().default("For"),
    sideBLabel: z.string().min(1).max(100).optional().default("Against"),
    turnDuration: z.number().int().min(30).max(600).optional().default(120),
  });

  app.post("/api/communities/:id/arenas", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const communityId = req.params.id;
      const parsed = createArenaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const membership = await storage.getMembership(communityId, userId);
      if (!membership || membership.powerLevel < POWER_LEVELS.CATALYST) {
        return res.status(403).json({ message: "Catalyst+ required" });
      }
      const arena = await storage.createArena({ ...parsed.data, communityId, creatorId: userId });
      res.json(arena);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/arenas/:id/arguments", requireAuth, async (req, res, next) => {
    try {
      const args = await storage.getArenaArguments(req.params.id);
      res.json(args.map((a) => ({ ...a, user: { ...a.user, password: undefined } })));
    } catch (err) {
      next(err);
    }
  });

  const createArgumentSchema = z.object({
    side: z.enum(["a", "b"]),
    content: z.string().min(1).max(2000),
  });

  app.post("/api/arenas/:id/arguments", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const parsed = createArgumentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const arg = await storage.createArenaArgument({ arenaId: req.params.id, userId, ...parsed.data });
      res.json(arg);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/arenas/:id/votes", requireAuth, async (req, res, next) => {
    try {
      const votes = await storage.getArenaVotes(req.params.id);
      res.json(votes);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/arenas/:id/vote", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const parsed = z.object({ side: z.enum(["a", "b"]) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid side" });
      const vote = await storage.castArenaVote({ arenaId: req.params.id, userId, side: parsed.data.side });
      res.json(vote);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/arenas/:id/close", requireAuth, async (req, res, next) => {
    try {
      const arena = await storage.closeArena(req.params.id);
      res.json(arena);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id/mosaics", requireAuth, async (req, res, next) => {
    try {
      const mosaicsList = await storage.getMosaics(req.params.id);
      res.json(mosaicsList);
    } catch (err) {
      next(err);
    }
  });

  const createMosaicSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional().default(""),
    format: z.enum(["document", "playlist", "board", "story"]).optional().default("board"),
    rules: z.string().max(500).optional().default(""),
  });

  app.post("/api/communities/:id/mosaics", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const communityId = req.params.id;
      const parsed = createMosaicSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const membership = await storage.getMembership(communityId, userId);
      if (!membership || membership.powerLevel < POWER_LEVELS.MEMBER) {
        return res.status(403).json({ message: "Members+ required" });
      }
      const mosaic = await storage.createMosaic({ ...parsed.data, communityId, creatorId: userId });
      res.json(mosaic);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/mosaics/:id/pieces", requireAuth, async (req, res, next) => {
    try {
      const pieces = await storage.getMosaicPieces(req.params.id);
      res.json(pieces.map((p) => ({ ...p, user: { ...p.user, password: undefined } })));
    } catch (err) {
      next(err);
    }
  });

  const createPieceSchema = z.object({
    pieceType: z.enum(["text", "link", "image"]).optional().default("text"),
    content: z.string().min(1).max(5000),
  });

  app.post("/api/mosaics/:id/pieces", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const parsed = createPieceSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const piece = await storage.createMosaicPiece({ mosaicId: req.params.id, userId, ...parsed.data });
      res.json(piece);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/communities/:id/fogueiras", requireAuth, async (req, res, next) => {
    try {
      const fogueirasList = await storage.getFogueiras(req.params.id);
      res.json(fogueirasList);
    } catch (err) {
      next(err);
    }
  });

  const createFogueiraSchema = z.object({
    title: z.string().min(1).max(200),
  });

  app.post("/api/communities/:id/fogueiras", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const communityId = req.params.id;
      const parsed = createFogueiraSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const membership = await storage.getMembership(communityId, userId);
      if (!membership || membership.powerLevel < POWER_LEVELS.CATALYST) {
        return res.status(403).json({ message: "Catalyst+ required to start a Fogueira" });
      }
      const fogueira = await storage.createFogueira({ ...parsed.data, communityId, creatorId: userId });
      res.json(fogueira);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/fogueiras/:id/end", requireAuth, async (req, res, next) => {
    try {
      const fogueira = await storage.endFogueira(req.params.id);
      res.json(fogueira);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/fogueiras/:id/brasas", requireAuth, async (req, res, next) => {
    try {
      const brasas = await storage.getFogueiraBrasas(req.params.id);
      res.json(brasas.map((b) => ({ ...b, user: { ...b.user, password: undefined } })));
    } catch (err) {
      next(err);
    }
  });

  const createBrasaSchema = z.object({
    content: z.string().min(1).max(280),
  });

  app.post("/api/fogueiras/:id/brasas", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as any).id;
      const parsed = createBrasaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      const brasa = await storage.createFogueiraBrasa({ fogueiraId: req.params.id, userId, content: parsed.data.content });
      res.json(brasa);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/fogueiras/:id/join", requireAuth, async (req, res, next) => {
    try {
      const parsed = z.object({ asSpeaker: z.boolean().optional().default(false) }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid" });
      await storage.joinFogueira(req.params.id, parsed.data.asSpeaker);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return httpServer;
}
