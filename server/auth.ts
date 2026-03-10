import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { storage } from "./storage";
import type { Express, Request } from "express";
import { createServer } from "http";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const verify = await scryptAsync(password, salt);
  return hash === verify;
}

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      },
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "User not found" });
        const valid = await verifyPassword(password, user.password);
        if (!valid) return done(null, false, { message: "Invalid password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      if (password.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
      const hashedPassword = await hashPassword(password);
      const colors = ["#E63946", "#F4A261", "#2A9D8F", "#9B5DE5", "#00BBF9", "#F15BB5", "#E76F51"];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });
      await storage.updateUserProfile(user.id, { avatarColor });
      const updatedUser = await storage.getUser(user.id);

      req.login(updatedUser!, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = updatedUser!;
        return res.json(safeUser);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      return res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const { password: _, ...safeUser } = req.user as any;
    return res.json(safeUser);
  });

  app.patch("/api/auth/profile", async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const userId = (req.user as any).id;
      const { bio, avatarColor } = req.body;
      const user = await storage.updateUserProfile(userId, { bio, avatarColor });
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (err) {
      next(err);
    }
  });
}
