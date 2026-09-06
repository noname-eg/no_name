import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Express, Request, RequestHandler, Response } from "express";
import { z } from "zod";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "no_name_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;

type AdminRole = "admin" | "editor";
type AdminUser = { id: string; role: AdminRole; isActive: boolean };
type AdminRecord = { id: string; username: string; password_hash: string; role: AdminRole; is_active: boolean };
type SessionRecord = { id: string; admin_user_id: string; expires_at: string; revoked_at: string | null };

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

const loginSchema = z.object({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(256),
});

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getSupabaseConfig() {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !serviceRoleKey) throw new Error("Supabase admin authentication is not configured");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("SUPABASE_URL must be a valid Supabase project URL");
  }

  const hasPath = parsedUrl.pathname.split("/").some(Boolean);
  if ((parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") || hasPath || parsedUrl.search || parsedUrl.hash) {
    throw new Error("SUPABASE_URL must contain only the Supabase project URL, without /rest/v1");
  }

  return { url: parsedUrl.origin, serviceRoleKey };
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase request failed with status ${response.status}`);
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

export async function uploadSupabaseObject(path: string, contentType: string, body: Buffer) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/storage/v1/object/${path}`, {
    method: "POST",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": contentType, "x-upsert": "false" },
    body: body as unknown as BodyInit,
  });
  if (!response.ok) throw new Error(`Supabase storage upload failed with status ${response.status}`);
}

export async function deleteSupabaseObject(path: string) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/storage/v1/object/${path}`, {
    method: "DELETE",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  if (!response.ok) throw new Error(`Supabase storage delete failed with status ${response.status}`);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const [salt, encodedKey] = encodedHash.split(":");
  if (!salt || !encodedKey) return false;
  const storedKey = Buffer.from(encodedKey, "base64url");
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(key: string) {
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt <= Date.now()) {
    loginAttempts.delete(key);
    return false;
  }
  return attempt.count >= LOGIN_LIMIT;
}

function recordFailedAttempt(key: string) {
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    loginAttempts.set(key, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function clearFailedAttempts(key: string) {
  loginAttempts.delete(key);
}

const loginRateLimit: RequestHandler = (req, res, next) => {
  if (isRateLimited(getClientKey(req))) {
    res.status(429).json({ error: "Too many login attempts. Try again later." });
    return;
  }
  next();
};

function setSessionCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

function clearSessionCookie(res: Response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

function getCookie(req: Request, name: string) {
  const header = req.headers.cookie || "";
  const cookie = header.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
}

async function findAdmin(username: string) {
  const rows = await supabaseRequest<AdminRecord[]>(`admin_users?select=id,username,password_hash,role,is_active&username=eq.${encodeURIComponent(username)}&limit=1`);
  return rows[0];
}

async function findSession(token: string) {
  const tokenHash = hashSessionToken(token);
  const rows = await supabaseRequest<SessionRecord[]>(`admin_sessions?select=id,admin_user_id,expires_at,revoked_at&token_hash=eq.${tokenHash}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`);
  return rows[0];
}

async function findActiveAdmin(id: string) {
  const rows = await supabaseRequest<AdminRecord[]>(`admin_users?select=id,role,is_active&id=eq.${encodeURIComponent(id)}&is_active=eq.true&limit=1`);
  const record = rows[0];
  return record ? { id: record.id, role: record.role, isActive: record.is_active } : undefined;
}

async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  await supabaseRequest("admin_sessions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      admin_user_id: adminId,
      token_hash: hashSessionToken(token),
      expires_at: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    }),
  });
  return token;
}

async function revokeSession(token: string) {
  await supabaseRequest(`admin_sessions?token_hash=eq.${hashSessionToken(token)}&revoked_at=is.null`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
}

export async function writeAuditLog(action: string, adminUserId?: string, metadata: Record<string, unknown> = {}) {
  try {
    await supabaseRequest("audit_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ action, admin_user_id: adminUserId || null, metadata }),
    });
  } catch (error) {
    console.error("Unable to write admin audit log", error);
  }
}

async function loadAdminFromRequest(req: Request) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return undefined;
  const session = await findSession(token);
  if (!session) return undefined;
  return findActiveAdmin(session.admin_user_id);
}

export const requireSession: RequestHandler = async (req, res, next) => {
  try {
    const admin = await loadAdminFromRequest(req);
    if (!admin) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin session lookup failed", error);
    res.status(503).json({ error: "Admin authentication is not configured." });
  }
};

export const requireRole = (role: AdminRole): RequestHandler => (req, res, next) => {
  if (!req.admin) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (req.admin.role !== role) {
    res.status(403).json({ error: "Insufficient permissions." });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  await requireSession(req, res, () => requireRole("admin")(req, res, next));
};

export function registerAuthRoutes(app: Express) {
  app.post("/api/admin/login", loginRateLimit, async (req, res) => {
    const clientKey = getClientKey(req);
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      recordFailedAttempt(clientKey);
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    try {
      const admin = await findAdmin(parsed.data.username);
      const valid = Boolean(admin?.is_active) && Boolean(admin) && await verifyPassword(parsed.data.password, admin!.password_hash);
      if (!valid) {
        recordFailedAttempt(clientKey);
        res.status(401).json({ error: "Invalid username or password." });
        return;
      }

      const token = await createSession(admin!.id);
      clearFailedAttempts(clientKey);
      setSessionCookie(res, token);
      await supabaseRequest(`admin_users?id=eq.${encodeURIComponent(admin!.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ last_login_at: new Date().toISOString() }),
      });
      await writeAuditLog("admin.login", admin!.id);
      res.json({ authenticated: true, user: { id: admin!.id, role: admin!.role } });
    } catch (error) {
      console.error("Admin login failed", error);
      res.status(503).json({ error: "Admin authentication is not configured." });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    const token = getCookie(req, SESSION_COOKIE);
    clearSessionCookie(res);
    if (!token) {
      res.status(204).send();
      return;
    }
    try {
      const session = await findSession(token);
      await revokeSession(token);
      await writeAuditLog("admin.logout", session?.admin_user_id);
    } catch (error) {
      console.error("Admin logout failed", error);
    }
    res.status(204).send();
  });

  app.get("/api/admin/session", async (req, res) => {
    try {
      const admin = await loadAdminFromRequest(req);
      if (!admin) {
        res.status(401).json({ authenticated: false });
        return;
      }
      res.json({ authenticated: true, user: { id: admin.id, role: admin.role } });
    } catch (error) {
      console.error("Admin session check failed", error);
      res.status(503).json({ error: "Admin authentication is not configured." });
    }
  });

  app.get("/api/admin/check", requireAdmin, (req, res) => {
    res.json({ authenticated: true, user: { id: req.admin!.id, role: req.admin!.role } });
  });
}
