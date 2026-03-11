import {
  type User,
  type InsertUser,
  type Community,
  type InsertCommunity,
  type CommunityMember,
  type InsertCommunityMember,
  type Thread,
  type InsertThread,
  type ThreadMessage,
  type InsertThreadMessage,
  type Mission,
  type InsertMission,
  type MissionContribution,
  type InsertMissionContribution,
  type Poll,
  type InsertPoll,
  type PollOption,
  type InsertPollOption,
  type PollVote,
  type InsertPollVote,
  type Arena,
  type InsertArena,
  type ArenaArgument,
  type InsertArenaArgument,
  type ArenaVote,
  type InsertArenaVote,
  type Mosaic,
  type InsertMosaic,
  type MosaicPiece,
  type InsertMosaicPiece,
  type Fogueira,
  type InsertFogueira,
  type FogueiraBrasa,
  type InsertFogueiraBrasa,
  users,
  communities,
  communityMembers,
  threads,
  threadMessages,
  missions,
  missionContributions,
  polls,
  pollOptions,
  pollVotes,
  arenas,
  arenaArguments,
  arenaVotes,
  mosaics,
  mosaicPieces,
  fogueiras,
  fogueiraBrasas,
  POWER_LEVELS,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: string, data: { bio?: string; avatarColor?: string }): Promise<User>;

  getAllCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(data: InsertCommunity & { founderId: string }): Promise<Community>;

  joinCommunity(communityId: string, userId: string, powerLevel?: number): Promise<CommunityMember>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;
  getCommunityMembers(communityId: string): Promise<(CommunityMember & { user: User })[]>;
  getUserMemberCommunityIds(userId: string): Promise<string[]>;
  getUserCommunities(userId: string): Promise<(CommunityMember & { community: Community })[]>;
  getMembership(communityId: string, userId: string): Promise<CommunityMember | undefined>;

  getThreads(communityId: string): Promise<Thread[]>;
  createThread(data: InsertThread & { authorId: string }): Promise<Thread>;
  toggleThreadPin(threadId: string): Promise<Thread>;
  archiveThread(threadId: string): Promise<Thread>;

  getMessages(threadId: string): Promise<(ThreadMessage & { author: User })[]>;
  createMessage(data: InsertThreadMessage & { authorId: string }): Promise<ThreadMessage>;

  getMissions(communityId: string): Promise<Mission[]>;
  getMission(id: string): Promise<Mission | undefined>;
  createMission(data: InsertMission & { creatorId: string }): Promise<Mission>;
  getMissionContributions(missionId: string): Promise<(MissionContribution & { user: User })[]>;
  createMissionContribution(data: InsertMissionContribution & { userId: string }): Promise<MissionContribution>;
  approveMissionContribution(id: string): Promise<MissionContribution>;

  getPolls(communityId: string): Promise<Poll[]>;
  getPoll(id: string): Promise<Poll | undefined>;
  createPoll(data: InsertPoll & { creatorId: string }, options: string[]): Promise<Poll>;
  getPollOptions(pollId: string): Promise<PollOption[]>;
  getPollVotes(pollId: string): Promise<PollVote[]>;
  castPollVote(data: InsertPollVote & { userId: string; weight: number }): Promise<PollVote>;
  closePoll(id: string): Promise<Poll>;

  getArenas(communityId: string): Promise<Arena[]>;
  getArena(id: string): Promise<Arena | undefined>;
  createArena(data: InsertArena & { creatorId: string }): Promise<Arena>;
  getArenaArguments(arenaId: string): Promise<(ArenaArgument & { user: User })[]>;
  createArenaArgument(data: InsertArenaArgument & { userId: string }): Promise<ArenaArgument>;
  getArenaVotes(arenaId: string): Promise<ArenaVote[]>;
  castArenaVote(data: InsertArenaVote & { userId: string }): Promise<ArenaVote>;
  closeArena(id: string): Promise<Arena>;

  getMosaics(communityId: string): Promise<Mosaic[]>;
  getMosaic(id: string): Promise<Mosaic | undefined>;
  createMosaic(data: InsertMosaic & { creatorId: string }): Promise<Mosaic>;
  getMosaicPieces(mosaicId: string): Promise<(MosaicPiece & { user: User })[]>;
  createMosaicPiece(data: InsertMosaicPiece & { userId: string }): Promise<MosaicPiece>;

  getFogueiras(communityId: string): Promise<Fogueira[]>;
  getFogueira(id: string): Promise<Fogueira | undefined>;
  createFogueira(data: InsertFogueira & { creatorId: string }): Promise<Fogueira>;
  endFogueira(id: string): Promise<Fogueira>;
  getFogueiraBrasas(fogueiraId: string): Promise<(FogueiraBrasa & { user: User })[]>;
  createFogueiraBrasa(data: InsertFogueiraBrasa & { userId: string }): Promise<FogueiraBrasa>;
  joinFogueira(fogueiraId: string, asSpeaker: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: string, data: { bio?: string; avatarColor?: string }): Promise<User> {
    const updates: Partial<User> = {};
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.avatarColor !== undefined) updates.avatarColor = data.avatarColor;
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllCommunities(): Promise<Community[]> {
    return db.select().from(communities).orderBy(desc(communities.heatScore));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async createCommunity(data: InsertCommunity & { founderId: string }): Promise<Community> {
    const gridX = (Math.random() - 0.5) * 10;
    const gridY = (Math.random() - 0.5) * 10;
    const [community] = await db
      .insert(communities)
      .values({
        ...data,
        founderId: data.founderId,
        memberCount: 1,
        heatScore: Math.floor(Math.random() * 30 + 10),
        gridX,
        gridY,
      })
      .returning();
    return community;
  }

  async joinCommunity(communityId: string, userId: string, powerLevel: number = POWER_LEVELS.MEMBER): Promise<CommunityMember> {
    const existing = await this.getMembership(communityId, userId);
    if (existing) return existing;

    const [member] = await db
      .insert(communityMembers)
      .values({ communityId, userId, powerLevel })
      .returning();

    await db
      .update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));

    return member;
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      );
    await db
      .update(communities)
      .set({ memberCount: sql`GREATEST(${communities.memberCount} - 1, 0)` })
      .where(eq(communities.id, communityId));
  }

  async getCommunityMembers(communityId: string): Promise<(CommunityMember & { user: User })[]> {
    const members = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(desc(communityMembers.powerLevel));

    const result: (CommunityMember & { user: User })[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        result.push({ ...member, user });
      }
    }
    return result;
  }

  async getUserMemberCommunityIds(userId: string): Promise<string[]> {
    const members = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));
    return members.map((m) => m.communityId);
  }

  async getUserCommunities(userId: string): Promise<(CommunityMember & { community: Community })[]> {
    const members = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const result: (CommunityMember & { community: Community })[] = [];
    for (const member of members) {
      const community = await this.getCommunity(member.communityId);
      if (community) {
        result.push({ ...member, community });
      }
    }
    return result;
  }

  async getMembership(communityId: string, userId: string): Promise<CommunityMember | undefined> {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      );
    return member;
  }

  async getThreads(communityId: string): Promise<Thread[]> {
    return db
      .select()
      .from(threads)
      .where(and(eq(threads.communityId, communityId), eq(threads.isArchived, false)))
      .orderBy(desc(threads.isPinned), desc(threads.lastActivityAt));
  }

  async createThread(data: InsertThread & { authorId: string }): Promise<Thread> {
    const [thread] = await db
      .insert(threads)
      .values({
        communityId: data.communityId,
        authorId: data.authorId,
        title: data.title,
        content: data.content,
      })
      .returning();
    return thread;
  }

  async toggleThreadPin(threadId: string): Promise<Thread> {
    const [thread] = await db.select().from(threads).where(eq(threads.id, threadId));
    const [updated] = await db
      .update(threads)
      .set({ isPinned: !thread.isPinned })
      .where(eq(threads.id, threadId))
      .returning();
    return updated;
  }

  async archiveThread(threadId: string): Promise<Thread> {
    const [updated] = await db
      .update(threads)
      .set({ isArchived: true })
      .where(eq(threads.id, threadId))
      .returning();
    return updated;
  }

  async getMessages(threadId: string): Promise<(ThreadMessage & { author: User })[]> {
    const msgs = await db
      .select()
      .from(threadMessages)
      .where(eq(threadMessages.threadId, threadId))
      .orderBy(threadMessages.createdAt);

    const result: (ThreadMessage & { author: User })[] = [];
    for (const msg of msgs) {
      const author = await this.getUser(msg.authorId);
      if (author) {
        result.push({ ...msg, author });
      }
    }
    return result;
  }

  async createMessage(data: InsertThreadMessage & { authorId: string }): Promise<ThreadMessage> {
    const [message] = await db
      .insert(threadMessages)
      .values({
        threadId: data.threadId,
        authorId: data.authorId,
        content: data.content,
      })
      .returning();

    await db
      .update(threads)
      .set({
        messageCount: sql`${threads.messageCount} + 1`,
        lastActivityAt: new Date(),
      })
      .where(eq(threads.id, data.threadId));

    return message;
  }

  async getMissions(communityId: string): Promise<Mission[]> {
    return db.select().from(missions).where(eq(missions.communityId, communityId)).orderBy(desc(missions.createdAt));
  }

  async getMission(id: string): Promise<Mission | undefined> {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission;
  }

  async createMission(data: InsertMission & { creatorId: string }): Promise<Mission> {
    const [mission] = await db.insert(missions).values({
      communityId: data.communityId,
      creatorId: data.creatorId,
      title: data.title,
      description: data.description,
      targetCount: data.targetCount,
    }).returning();
    return mission;
  }

  async getMissionContributions(missionId: string): Promise<(MissionContribution & { user: User })[]> {
    const contribs = await db.select().from(missionContributions)
      .where(eq(missionContributions.missionId, missionId))
      .orderBy(desc(missionContributions.createdAt));
    const result: (MissionContribution & { user: User })[] = [];
    for (const c of contribs) {
      const user = await this.getUser(c.userId);
      if (user) result.push({ ...c, user });
    }
    return result;
  }

  async createMissionContribution(data: InsertMissionContribution & { userId: string }): Promise<MissionContribution> {
    const [contrib] = await db.insert(missionContributions).values({
      missionId: data.missionId,
      userId: data.userId,
      content: data.content,
      amount: data.amount || 1,
    }).returning();

    await db.update(missions).set({
      currentCount: sql`${missions.currentCount} + ${data.amount || 1}`,
    }).where(eq(missions.id, data.missionId));

    const mission = await this.getMission(data.missionId);
    if (mission && mission.currentCount >= mission.targetCount) {
      await db.update(missions).set({ isCompleted: true }).where(eq(missions.id, data.missionId));
    }

    return contrib;
  }

  async approveMissionContribution(id: string): Promise<MissionContribution> {
    const [updated] = await db.update(missionContributions)
      .set({ isApproved: true })
      .where(eq(missionContributions.id, id))
      .returning();
    return updated;
  }

  async getPolls(communityId: string): Promise<Poll[]> {
    return db.select().from(polls).where(eq(polls.communityId, communityId)).orderBy(desc(polls.createdAt));
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll;
  }

  async createPoll(data: InsertPoll & { creatorId: string }, options: string[]): Promise<Poll> {
    const [poll] = await db.insert(polls).values({
      communityId: data.communityId,
      creatorId: data.creatorId,
      question: data.question,
      pollType: data.pollType,
      isAnonymous: data.isAnonymous,
    }).returning();

    for (let i = 0; i < options.length; i++) {
      await db.insert(pollOptions).values({
        pollId: poll.id,
        text: options[i],
        orderIndex: i,
      });
    }

    return poll;
  }

  async getPollOptions(pollId: string): Promise<PollOption[]> {
    return db.select().from(pollOptions).where(eq(pollOptions.pollId, pollId)).orderBy(pollOptions.orderIndex);
  }

  async getPollVotes(pollId: string): Promise<PollVote[]> {
    return db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId));
  }

  async castPollVote(data: InsertPollVote & { userId: string; weight: number }): Promise<PollVote> {
    const existing = await db.select().from(pollVotes).where(
      and(eq(pollVotes.pollId, data.pollId), eq(pollVotes.userId, data.userId))
    );
    if (existing.length > 0) {
      const [updated] = await db.update(pollVotes)
        .set({ optionId: data.optionId, weight: data.weight })
        .where(eq(pollVotes.id, existing[0].id))
        .returning();
      return updated;
    }
    const [vote] = await db.insert(pollVotes).values({
      pollId: data.pollId,
      optionId: data.optionId,
      userId: data.userId,
      weight: data.weight,
    }).returning();
    return vote;
  }

  async closePoll(id: string): Promise<Poll> {
    const [updated] = await db.update(polls).set({ isActive: false }).where(eq(polls.id, id)).returning();
    return updated;
  }

  async getArenas(communityId: string): Promise<Arena[]> {
    return db.select().from(arenas).where(eq(arenas.communityId, communityId)).orderBy(desc(arenas.createdAt));
  }

  async getArena(id: string): Promise<Arena | undefined> {
    const [arena] = await db.select().from(arenas).where(eq(arenas.id, id));
    return arena;
  }

  async createArena(data: InsertArena & { creatorId: string }): Promise<Arena> {
    const [arena] = await db.insert(arenas).values({
      communityId: data.communityId,
      creatorId: data.creatorId,
      proposition: data.proposition,
      sideALabel: data.sideALabel,
      sideBLabel: data.sideBLabel,
      turnDuration: data.turnDuration,
    }).returning();
    return arena;
  }

  async getArenaArguments(arenaId: string): Promise<(ArenaArgument & { user: User })[]> {
    const args = await db.select().from(arenaArguments)
      .where(eq(arenaArguments.arenaId, arenaId))
      .orderBy(arenaArguments.createdAt);
    const result: (ArenaArgument & { user: User })[] = [];
    for (const a of args) {
      const user = await this.getUser(a.userId);
      if (user) result.push({ ...a, user });
    }
    return result;
  }

  async createArenaArgument(data: InsertArenaArgument & { userId: string }): Promise<ArenaArgument> {
    const [arg] = await db.insert(arenaArguments).values({
      arenaId: data.arenaId,
      userId: data.userId,
      side: data.side,
      content: data.content,
    }).returning();
    return arg;
  }

  async getArenaVotes(arenaId: string): Promise<ArenaVote[]> {
    return db.select().from(arenaVotes).where(eq(arenaVotes.arenaId, arenaId));
  }

  async castArenaVote(data: InsertArenaVote & { userId: string }): Promise<ArenaVote> {
    const existing = await db.select().from(arenaVotes).where(
      and(eq(arenaVotes.arenaId, data.arenaId), eq(arenaVotes.userId, data.userId))
    );
    if (existing.length > 0) {
      const [updated] = await db.update(arenaVotes)
        .set({ side: data.side })
        .where(eq(arenaVotes.id, existing[0].id))
        .returning();
      return updated;
    }
    const [vote] = await db.insert(arenaVotes).values({
      arenaId: data.arenaId,
      userId: data.userId,
      side: data.side,
    }).returning();
    return vote;
  }

  async closeArena(id: string): Promise<Arena> {
    const [updated] = await db.update(arenas).set({ status: "closed" }).where(eq(arenas.id, id)).returning();
    return updated;
  }

  async getMosaics(communityId: string): Promise<Mosaic[]> {
    return db.select().from(mosaics).where(eq(mosaics.communityId, communityId)).orderBy(desc(mosaics.createdAt));
  }

  async getMosaic(id: string): Promise<Mosaic | undefined> {
    const [mosaic] = await db.select().from(mosaics).where(eq(mosaics.id, id));
    return mosaic;
  }

  async createMosaic(data: InsertMosaic & { creatorId: string }): Promise<Mosaic> {
    const [mosaic] = await db.insert(mosaics).values({
      communityId: data.communityId,
      creatorId: data.creatorId,
      title: data.title,
      description: data.description,
      format: data.format,
      rules: data.rules,
    }).returning();
    return mosaic;
  }

  async getMosaicPieces(mosaicId: string): Promise<(MosaicPiece & { user: User })[]> {
    const pieces = await db.select().from(mosaicPieces)
      .where(eq(mosaicPieces.mosaicId, mosaicId))
      .orderBy(mosaicPieces.createdAt);
    const result: (MosaicPiece & { user: User })[] = [];
    for (const p of pieces) {
      const user = await this.getUser(p.userId);
      if (user) result.push({ ...p, user });
    }
    return result;
  }

  async createMosaicPiece(data: InsertMosaicPiece & { userId: string }): Promise<MosaicPiece> {
    const [piece] = await db.insert(mosaicPieces).values({
      mosaicId: data.mosaicId,
      userId: data.userId,
      pieceType: data.pieceType,
      content: data.content,
    }).returning();
    return piece;
  }

  async getFogueiras(communityId: string): Promise<Fogueira[]> {
    return db.select().from(fogueiras)
      .where(eq(fogueiras.communityId, communityId))
      .orderBy(desc(fogueiras.createdAt));
  }

  async getFogueira(id: string): Promise<Fogueira | undefined> {
    const [f] = await db.select().from(fogueiras).where(eq(fogueiras.id, id));
    return f;
  }

  async createFogueira(data: InsertFogueira & { creatorId: string }): Promise<Fogueira> {
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const [f] = await db.insert(fogueiras).values({
      communityId: data.communityId,
      creatorId: data.creatorId,
      title: data.title,
      endsAt,
      speakerCount: 1,
    }).returning();
    return f;
  }

  async endFogueira(id: string): Promise<Fogueira> {
    const [updated] = await db.update(fogueiras)
      .set({ isActive: false })
      .where(eq(fogueiras.id, id))
      .returning();
    return updated;
  }

  async getFogueiraBrasas(fogueiraId: string): Promise<(FogueiraBrasa & { user: User })[]> {
    const brasas = await db.select().from(fogueiraBrasas)
      .where(eq(fogueiraBrasas.fogueiraId, fogueiraId))
      .orderBy(fogueiraBrasas.createdAt);
    const result: (FogueiraBrasa & { user: User })[] = [];
    for (const b of brasas) {
      const user = await this.getUser(b.userId);
      if (user) result.push({ ...b, user });
    }
    return result;
  }

  async createFogueiraBrasa(data: InsertFogueiraBrasa & { userId: string }): Promise<FogueiraBrasa> {
    const [brasa] = await db.insert(fogueiraBrasas).values({
      fogueiraId: data.fogueiraId,
      userId: data.userId,
      content: data.content,
    }).returning();
    return brasa;
  }

  async joinFogueira(fogueiraId: string, asSpeaker: boolean): Promise<void> {
    if (asSpeaker) {
      await db.update(fogueiras)
        .set({ speakerCount: sql`LEAST(${fogueiras.speakerCount} + 1, 12)` })
        .where(eq(fogueiras.id, fogueiraId));
    } else {
      await db.update(fogueiras)
        .set({ listenerCount: sql`${fogueiras.listenerCount} + 1` })
        .where(eq(fogueiras.id, fogueiraId));
    }
  }
}

export const storage = new DatabaseStorage();
