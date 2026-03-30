import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  getSession,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
} from "../lib/auth";
import { sendSuccess, sendError } from "../lib/response";

const router = Router();
const SALT_ROUNDS = 12;

const useSecureCookie = process.env.COOKIE_SECURE === "true";

function setSessionCookie(res: Response, sid: string) {
  res.cookie("sid", sid, {
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================= REGISTER =================
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body ?? {};

    if (!email || !isValidEmail(email)) {
      return sendError(res, 400, "Invalid email");
    }

    if (!password || password.length < 6) {
      return sendError(res, 400, "Password too short");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        username: username ?? null,
      })
      .returning();

    const session = await createSession({ user });
    setSessionCookie(res, session);

    return sendSuccess(res, { user });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    return sendError(res, 500, "Register failed");
  }
});

// ================= LOGIN =================
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return sendError(res, 400, "Missing credentials");
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()));

    if (!user) {
      return sendError(res, 401, "Invalid login");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return sendError(res, 401, "Invalid login");
    }

    const session = await createSession({ user });
    setSessionCookie(res, session);

    return sendSuccess(res, { user });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return sendError(res, 500, "Login failed");
  }
});

// ================= USER =================
router.get("/auth/user", async (req: any, res: Response) => {
  try {
    const sid = getSessionId(req);

    if (!sid) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const session = await getSession(sid);

    if (!session || !session.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    return res.json({ success: true, user: session.user });
  } catch (err) {
    console.error("AUTH USER ERROR:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});
// ================= RESET PASSWORD =================
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body ?? {};

    if (!email || !isValidEmail(email)) {
      return sendError(res, 400, "Invalid email");
    }
    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters");
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()));

    if (!user) {
      // Don't reveal if email exists
      return sendSuccess(res, { message: "If the email exists, the password has been reset." });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, user.id));

    return sendSuccess(res, { message: "Password reset successfully. You can now login with your new password." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return sendError(res, 500, "Password reset failed");
  }
});

// ================= LOGOUT =================
router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  return sendSuccess(res, null);
});

export default router;
