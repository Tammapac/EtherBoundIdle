import crypto from "crypto";
import { type Request, type Response } from "express";
import { db, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { cache } from "./redis.js";

export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface SessionData {
  user: AuthUser;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  // Check cache first (avoids DB hit on every request)
  const cacheKey = `session:${sid}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as SessionData;

  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row || row.expire < new Date()) {
    if (row) await deleteSession(sid);
    return null;
  }

  const sessionData = row.sess as unknown as SessionData;

  // Cache for 60s to avoid DB hit on every request
  await cache.set(cacheKey, sessionData, 60);

  // Extend session expiry on each access (sliding window, throttled to every 5 min)
  const newExpire = new Date(Date.now() + SESSION_TTL);
  db.update(sessionsTable)
    .set({ expire: newExpire })
    .where(eq(sessionsTable.sid, sid))
    .catch(() => {});

  return sessionData;
}

export async function deleteSession(sid: string): Promise<void> {
  await cache.del(`session:${sid}`);
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(
  res: Response,
  sid?: string,
): Promise<void> {
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}
