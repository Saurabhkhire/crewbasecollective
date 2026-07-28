import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db/index.js";
import { adminUsers } from "./db/schema.js";

export const SESSION_COOKIE = "cbc_admin_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-in-production-min-32";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function encodeSession(adminId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ adminId, exp: Date.now() + SESSION_MAX_AGE_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return data.adminId as string;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, adminId: string): void {
  res.cookie(SESSION_COOKIE, encodeSession(adminId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<{ id: string; username: string } | null> {
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);
  if (!admin) return null;
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;
  return { id: admin.id, username: admin.username };
}

export async function getAdminFromRequest(
  req: Request
): Promise<{ id: string; username: string } | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  const adminId = decodeSession(token);
  if (!adminId) return null;
  const [admin] = await db
    .select({ id: adminUsers.id, username: adminUsers.username })
    .from(adminUsers)
    .where(eq(adminUsers.id, adminId))
    .limit(1);
  return admin ?? null;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { admin: typeof admin }).admin = admin;
  next();
}
