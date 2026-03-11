import { storage } from "./storage";
import { db } from "./db";
import { users, communities } from "@shared/schema";
import { POWER_LEVELS, type Community } from "@shared/schema";

const scryptAsync = async (password: string, salt: string): Promise<string> => {
  const { scrypt } = await import("crypto");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
};

async function hashPassword(password: string): Promise<string> {
  const { randomBytes } = await import("crypto");
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt);
  return `${salt}:${hash}`;
}

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  console.log("Seeding database...");

  const hashedPw = await hashPassword("demo1234");

  const seedUsers = [
    { username: "aurora", password: hashedPw, bio: "Building communities, one hexagon at a time.", avatarColor: "#E63946" },
    { username: "nexus", password: hashedPw, bio: "Tech enthusiast and open source advocate.", avatarColor: "#2A9D8F" },
    { username: "cipher", password: hashedPw, bio: "Game dev by day, pixel artist by night.", avatarColor: "#9B5DE5" },
    { username: "ember", password: hashedPw, bio: "Musician, producer, sound explorer.", avatarColor: "#F4A261" },
    { username: "atlas", password: hashedPw, bio: "Photographer capturing the world's stories.", avatarColor: "#00BBF9" },
  ];

  const createdUsers = [];
  for (const u of seedUsers) {
    const user = await storage.createUser({ username: u.username, password: u.password });
    await storage.updateUserProfile(user.id, { bio: u.bio, avatarColor: u.avatarColor });
    createdUsers.push(await storage.getUser(user.id));
  }

  const seedCommunities = [
    {
      name: "Rust Builders",
      description: "A community for Rust programming enthusiasts. Share projects, learn together, and build systems software.",
      color: "#E63946",
      category: "technology",
      entryType: "open",
      heatScore: 87,
      coverImageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    },
    {
      name: "Pixel Forge",
      description: "Pixel art creators and retro game designers. Weekly challenges, asset sharing, and collaborative projects.",
      color: "#9B5DE5",
      category: "art",
      entryType: "open",
      heatScore: 72,
      coverImageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80",
    },
    {
      name: "Sound Lab",
      description: "Music production, sound design, and audio engineering. Share your tracks, get feedback, collaborate.",
      color: "#F4A261",
      category: "music",
      entryType: "open",
      heatScore: 65,
      coverImageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
    },
    {
      name: "Deep Reads",
      description: "Book club for those who love diving deep into non-fiction, philosophy, and science writing.",
      color: "#2A9D8F",
      category: "books",
      entryType: "question",
      heatScore: 45,
      coverImageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80",
    },
    {
      name: "Street Lens",
      description: "Street photography collective. Capture urban life, share stories behind your shots.",
      color: "#00BBF9",
      category: "photography",
      entryType: "open",
      heatScore: 58,
      coverImageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80",
    },
    {
      name: "Indie Games",
      description: "Independent game developers sharing progress, tools, and support. From concept to launch.",
      color: "#E76F51",
      category: "gaming",
      entryType: "open",
      heatScore: 91,
      coverImageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80",
    },
    {
      name: "Climate Action",
      description: "Discussing practical solutions to climate change. Science-based conversations and local action plans.",
      color: "#606C38",
      category: "science",
      entryType: "open",
      heatScore: 38,
      coverImageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80",
    },
    {
      name: "Startup Kitchen",
      description: "Entrepreneurs cooking up new ideas. Share your journey, get advice, find co-founders.",
      color: "#F15BB5",
      category: "finance",
      entryType: "approval",
      heatScore: 76,
      coverImageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80",
    },
    {
      name: "Trail Runners",
      description: "Trail running community. Race reports, gear reviews, training plans, and route sharing.",
      color: "#FEE440",
      category: "sports",
      entryType: "open",
      heatScore: 52,
      coverImageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80",
    },
  ];

  const createdCommunities: Community[] = [];
  for (let i = 0; i < seedCommunities.length; i++) {
    const founderIdx = i % createdUsers.length;
    const founder = createdUsers[founderIdx]!;
    const c = seedCommunities[i];

    const community = await storage.createCommunity({
      name: c.name,
      description: c.description,
      color: c.color,
      category: c.category,
      entryType: c.entryType,
      isPublic: true,
      founderId: founder.id,
    });

    await db.update(communities).set({
      heatScore: c.heatScore,
      coverImageUrl: c.coverImageUrl,
    }).where(
      (await import("drizzle-orm")).eq(communities.id, community.id)
    );

    await storage.joinCommunity(community.id, founder.id, POWER_LEVELS.FOUNDER);

    for (let j = 0; j < createdUsers.length; j++) {
      if (j !== founderIdx && Math.random() > 0.4) {
        const powerLevel = Math.random() > 0.7 ? POWER_LEVELS.CATALYST : POWER_LEVELS.MEMBER;
        await storage.joinCommunity(community.id, createdUsers[j]!.id, powerLevel);
      }
    }

    createdCommunities.push(community);
  }

  const threadData = [
    { idx: 0, title: "Welcome to Rust Builders!", content: "Introduce yourself and share what you're working on.", messages: ["Working on a CLI tool for project scaffolding!", "Just started learning Rust, excited to be here.", "Been using Rust for 2 years, happy to help newcomers."] },
    { idx: 0, title: "Async Rust patterns", content: "Let's discuss best practices for async programming in Rust.", messages: ["Tokio vs async-std - which do you prefer?", "I've been using tokio extensively, the ecosystem is much richer.", "Don't forget about smol - it's lightweight and great for smaller projects."] },
    { idx: 1, title: "Weekly Challenge: Isometric City", content: "This week's challenge: create an isometric city tile set.", messages: ["Here's my WIP - starting with a bakery tile.", "Love the warm tones! Maybe add some chimney smoke?"] },
    { idx: 2, title: "Favorite synth plugins 2026", content: "What synth plugins are you using this year?", messages: ["Vital is still the king of free synths.", "Pigments 5 has been incredible for sound design.", "Anyone tried the new Arturia collection?"] },
    { idx: 5, title: "Show your game!", content: "Post screenshots or links to your current project.", messages: ["Working on a roguelike with procedural narrative.", "My puzzle platformer just hit beta! Looking for testers.", "Love the art style on that platformer!"] },
    { idx: 3, title: "January Book: Thinking Fast and Slow", content: "Our first book of the year. Share your thoughts as you read.", messages: ["Chapter 3 on anchoring bias was eye-opening.", "I keep finding myself recognizing these biases in daily life now."] },
  ];

  for (const td of threadData) {
    const community = createdCommunities[td.idx];
    const authorIdx = (td.idx + 1) % createdUsers.length;
    const author = createdUsers[authorIdx]!;

    const thread = await storage.createThread({
      communityId: community.id,
      authorId: author.id,
      title: td.title,
      content: td.content,
    });

    for (let m = 0; m < td.messages.length; m++) {
      const msgAuthorIdx = (authorIdx + m + 1) % createdUsers.length;
      await storage.createMessage({
        threadId: thread.id,
        authorId: createdUsers[msgAuthorIdx]!.id,
        content: td.messages[m],
      });
    }
  }

  const { eq } = await import("drizzle-orm");

  const relatedGraph: number[][] = [
    [1, 2, 5, 7],       // 0: Rust Builders → Pixel Forge, Sound Lab, Indie Games, Startup Kitchen
    [0, 2, 5, 3],       // 1: Pixel Forge → Rust Builders, Sound Lab, Indie Games, Deep Reads
    [1, 3, 4, 7],       // 2: Sound Lab → Pixel Forge, Deep Reads, Street Lens, Startup Kitchen
    [2, 4, 6, 1],       // 3: Deep Reads → Sound Lab, Street Lens, Climate Action, Pixel Forge
    [3, 5, 6, 8],       // 4: Street Lens → Deep Reads, Indie Games, Climate Action, Trail Runners
    [0, 1, 4, 7, 8],    // 5: Indie Games → Rust Builders, Pixel Forge, Street Lens, Startup Kitchen, Trail Runners
    [3, 4, 8, 7],       // 6: Climate Action → Deep Reads, Street Lens, Trail Runners, Startup Kitchen
    [0, 2, 5, 6, 8],    // 7: Startup Kitchen → Rust Builders, Sound Lab, Indie Games, Climate Action, Trail Runners
    [4, 5, 6, 7],       // 8: Trail Runners → Street Lens, Indie Games, Climate Action, Startup Kitchen
  ];

  for (let i = 0; i < createdCommunities.length; i++) {
    const relIds = relatedGraph[i].map((idx) => createdCommunities[idx].id);
    await db.update(communities).set({ relatedIds: relIds }).where(
      eq(communities.id, createdCommunities[i].id)
    );
  }

  const updatedCommunities = await storage.getAllCommunities();
  for (const c of updatedCommunities) {
    const members = await storage.getCommunityMembers(c.id);
    await db.update(communities).set({ memberCount: members.length }).where(
      eq(communities.id, c.id)
    );
  }

  console.log("Database seeded successfully!");
}
