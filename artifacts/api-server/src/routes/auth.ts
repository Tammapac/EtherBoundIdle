import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
  type AuthUser,
} from "../lib/auth";

const SALT_ROUNDS = 12;
const router: IRouter = Router();

const isProduction = process.env.NODE_ENV === "production";

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "lax" : "none",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function sanitizeUser(row: typeof usersTable.$inferSelect): AuthUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username ?? null,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    profileImageUrl: row.profileImageUrl ?? null,
  };
}

function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body ?? {};

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    if (username !== undefined && username !== null && typeof username !== "string") {
      res.status(400).json({ error: "Username must be a string." });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    let newUser;
    try {
      [newUser] = await db
        .insert(usersTable)
        .values({
          email: normalizedEmail,
          passwordHash,
          username: typeof username === "string" ? username.trim() || null : null,
        })
        .returning();
    } catch (dbErr: any) {
      const pgCode = dbErr?.code || dbErr?.cause?.code;
      const pgConstraint = dbErr?.constraint || dbErr?.cause?.constraint || "";
      if (pgCode === "23505" || pgConstraint.includes("email")) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
      }
      throw dbErr;
    }

    const authUser = sanitizeUser(newUser);
    const sessionData: SessionData = { user: authUser };
    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);

    res.status(201).json({ user: authUser });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }

    if (typeof password !== "string" || !password) {
      res.status(400).json({ error: "Password is required." });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()));

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const authUser = sanitizeUser(user);
    const sessionData: SessionData = { user: authUser };
    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);

    res.json({ user: authUser });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.get("/auth/user", (req: Request, res: Response) => {
  res.json({
    user: req.isAuthenticated() ? req.user : null,
  });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;
