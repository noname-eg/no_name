import { createHash, randomBytes } from "node:crypto";
import type { Express, Request, RequestHandler, Response } from "express";
import { z } from "zod";

const SESSION_COOKIE = "no_name_admin_session";
const CUSTOMER_SESSION_COOKIE = "no_name_customer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;

type AdminRole = "admin" | "editor";
type AdminUser = { id: string; email: string; role: AdminRole; isActive: boolean };
type AdminProfile = { id: string; email?: string; role: AdminRole; is_active: boolean };
type SupabaseUser = { id: string; email?: string };

declare global {
  namespace Express {
    interface Request { admin?: AdminUser; customer?: CustomerUser; }
  }
}

const loginSchema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(256) });
const customerProfileSchema = z.object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().regex(/^\d{7,15}$/), address: z.string().trim().max(500).optional() });
type CustomerUser = { id: string; email?: string };
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getSupabaseConfig() {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !serviceRoleKey) throw new Error("Supabase authentication is not configured");
  const parsedUrl = new URL(rawUrl);
  if ((parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") || parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
    throw new Error("SUPABASE_URL must contain only the Supabase project URL");
  }
  return { url: parsedUrl.origin, serviceRoleKey };
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!response.ok) throw new Error(`Supabase request failed with status ${response.status}`);
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

async function supabaseAuthRequest<T>(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    ...init,
    headers: { apikey: serviceRoleKey, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!response.ok) throw new Error(`Supabase Auth request failed with status ${response.status}`);
  return await response.json() as T;
}

export async function uploadSupabaseObject(path: string, contentType: string, body: Buffer) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/storage/v1/object/${path}`, { method: "POST", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": contentType, "x-upsert": "false" }, body: body as unknown as BodyInit });
  if (!response.ok) throw new Error(`Supabase storage upload failed with status ${response.status}`);
}

export async function deleteSupabaseObject(path: string) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/storage/v1/object/${path}`, { method: "DELETE", headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
  if (!response.ok) throw new Error(`Supabase storage delete failed with status ${response.status}`);
}

function getClientKey(req: Request) { return req.ip || req.socket.remoteAddress || "unknown"; }
function isRateLimited(key: string) { const attempt = loginAttempts.get(key); if (!attempt || attempt.resetAt <= Date.now()) { loginAttempts.delete(key); return false; } return attempt.count >= LOGIN_LIMIT; }
function recordFailedAttempt(key: string) { const current = loginAttempts.get(key); if (!current || current.resetAt <= Date.now()) loginAttempts.set(key, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS }); else current.count += 1; }
function clearFailedAttempts(key: string) { loginAttempts.delete(key); }
const loginRateLimit: RequestHandler = (req, res, next) => { if (isRateLimited(getClientKey(req))) { res.status(429).json({ error: "Too many login attempts. Try again later." }); return; } next(); };

function setSessionCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`);
}
function clearSessionCookie(res: Response) { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`); }
function setCustomerSessionCookie(res: Response, token: string) { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; res.setHeader("Set-Cookie", `${CUSTOMER_SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`); }
function clearCustomerSessionCookie(res: Response) { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; res.setHeader("Set-Cookie", `${CUSTOMER_SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`); }
function getCookie(req: Request, name: string) { const cookie = (req.headers.cookie || "").split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`)); return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined; }

async function findAdminProfile(user: SupabaseUser) {
  const rows = await supabaseRequest<AdminProfile[]>(`admin_profiles?select=id,role,is_active&id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&limit=1`);
  const profile = rows[0];
  return profile ? { id: profile.id, email: user.email || "", role: profile.role, isActive: profile.is_active } : undefined;
}

async function loadAdminFromRequest(req: Request) {
  const accessToken = getCookie(req, SESSION_COOKIE);
  if (!accessToken) return undefined;
  try {
    const user = await supabaseAuthRequest<SupabaseUser>("user", { headers: { Authorization: `Bearer ${accessToken}` } });
    return findAdminProfile(user);
  } catch { return undefined; }
}

export async function loadCustomerFromRequest(req: Request) {
  const accessToken = getCookie(req, CUSTOMER_SESSION_COOKIE);
  if (!accessToken) return undefined;
  try { return await supabaseAuthRequest<CustomerUser>("user", { headers: { Authorization: `Bearer ${accessToken}` } }); }
  catch { return undefined; }
}

export async function writeAuditLog(action: string, adminUserId?: string, metadata: Record<string, unknown> = {}) {
  try { await supabaseRequest("audit_logs", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ admin_user_id: adminUserId || null, action, metadata }) }); }
  catch (error) { console.error("Unable to write admin audit log", error); }
}

export const requireSession: RequestHandler = async (req, res, next) => {
  try {
    const admin = await loadAdminFromRequest(req);
    if (!admin) { res.status(401).json({ error: "Authentication required." }); return; }
    req.admin = admin;
    next();
  } catch (error) { console.error("Admin session lookup failed", error); res.status(503).json({ error: "Admin authentication is not configured." }); }
};

export const requireRole = (role: AdminRole): RequestHandler => (req, res, next) => { if (!req.admin) { res.status(401).json({ error: "Authentication required." }); return; } if (req.admin.role !== role) { res.status(403).json({ error: "Insufficient permissions." }); return; } next(); };
export const requireAdmin: RequestHandler = async (req, res, next) => { await requireSession(req, res, () => requireRole("admin")(req, res, next)); };
export const requireCustomer: RequestHandler = async (req, res, next) => { const customer = await loadCustomerFromRequest(req); if (!customer) { res.status(401).json({ error: "Customer authentication required." }); return; } req.customer = customer; next(); };

export function registerAuthRoutes(app: Express) {
  app.post("/api/admin/login", loginRateLimit, async (req, res) => {
    const clientKey = getClientKey(req);
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) { recordFailedAttempt(clientKey); res.status(401).json({ error: "Invalid email or password." }); return; }
    try {
      const auth = await supabaseAuthRequest<{ access_token: string; user: SupabaseUser }>("token?grant_type=password", { method: "POST", body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }) });
      const admin = await findAdminProfile(auth.user);
      if (!admin) { recordFailedAttempt(clientKey); res.status(403).json({ error: "This account is not an active administrator." }); return; }
      clearFailedAttempts(clientKey);
      setSessionCookie(res, auth.access_token);
      await writeAuditLog("admin.login", admin.id);
      res.json({ authenticated: true, user: { id: admin.id, email: admin.email, role: admin.role } });
    } catch (error) { console.error("Admin login failed", error); recordFailedAttempt(clientKey); res.status(401).json({ error: "Invalid email or password." }); }
  });
  app.post("/api/admin/logout", async (req, res) => { clearSessionCookie(res); res.status(204).send(); });
  app.get("/api/admin/session", async (req, res) => { try { const admin = await loadAdminFromRequest(req); if (!admin) { res.status(401).json({ authenticated: false }); return; } res.json({ authenticated: true, user: { id: admin.id, email: admin.email, role: admin.role } }); } catch { res.status(503).json({ error: "Admin authentication is not configured." }); } });
  app.get("/api/admin/check", requireAdmin, (req, res) => { res.json({ authenticated: true, user: { id: req.admin!.id, email: req.admin!.email, role: req.admin!.role } }); });

  app.post("/api/customer/register", async (req, res) => {
    const parsed = loginSchema.merge(customerProfileSchema).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid customer data." }); return; }
    try {
      const { email, password, fullName, phone, address } = parsed.data;
      const auth = await supabaseAuthRequest<CustomerUser>("admin/users", { method: "POST", headers: { Authorization: `Bearer ${getSupabaseConfig().serviceRoleKey}` }, body: JSON.stringify({ email, password, email_confirm: true }) });
      await supabaseRequest("customer_profiles?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: auth.id, full_name: fullName, phone, address: address || null }) });
      const session = await supabaseAuthRequest<{ access_token: string; user: CustomerUser }>("token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
      setCustomerSessionCookie(res, session.access_token);
      res.status(201).json({ authenticated: true, user: { id: auth.id, email } });
    } catch (error) { console.error("Customer registration failed", error); res.status(409).json({ error: "Unable to create customer account." }); }
  });
  app.post("/api/customer/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) { res.status(401).json({ error: "Invalid email or password." }); return; }
    try { const session = await supabaseAuthRequest<{ access_token: string; user: CustomerUser }>("token?grant_type=password", { method: "POST", body: JSON.stringify(parsed.data) }); setCustomerSessionCookie(res, session.access_token); res.json({ authenticated: true, user: session.user }); }
    catch { res.status(401).json({ error: "Invalid email or password." }); }
  });
  app.post("/api/customer/logout", async (_req, res) => { clearCustomerSessionCookie(res); res.status(204).send(); });
  app.get("/api/customer/session", async (req, res) => { const user = await loadCustomerFromRequest(req); if (!user) { res.status(401).json({ authenticated: false }); return; } res.json({ authenticated: true, user }); });
}
