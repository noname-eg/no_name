import { stdin as input, stdout as output } from "node:process";

type AuthUser = { id: string; email?: string };

function readSecret(prompt: string) {
  return new Promise<string>((resolve) => {
    output.write(prompt);
    let value = "";
    const onData = (chunk: Buffer | string) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") process.exit(130);
        if (character === "\r" || character === "\n") {
          input.setRawMode?.(false);
          input.pause();
          input.off("data", onData);
          output.write("\n");
          resolve(value);
        } else if (character === "\u007f") value = value.slice(0, -1);
        else value += character;
      }
    };
    input.resume();
    input.setRawMode?.(true);
    input.on("data", onData);
  });
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: pnpm admin:create <email>");
  process.exit(1);
}
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
try {
  const parsed = new URL(supabaseUrl);
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error();
} catch {
  console.error("SUPABASE_URL must be the project URL without /rest/v1.");
  process.exit(1);
}
const password = await readSecret("Password: ");
const confirmation = await readSecret("Confirm password: ");
if (password.length < 12 || password !== confirmation) {
  console.error("Passwords must match and be at least 12 characters.");
  process.exit(1);
}

const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, email_confirm: true }),
});
const authBody = await authResponse.json().catch(() => null) as AuthUser & { id?: string; msg?: string } | null;
if (!authResponse.ok || !authBody?.id) {
  console.error(`Unable to create Auth user (${authResponse.status}): ${authBody?.msg || "request failed"}`);
  process.exit(1);
}
const profileResponse = await fetch(`${supabaseUrl}/rest/v1/admin_profiles`, {
  method: "POST",
  headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify({ id: authBody.id, role: "admin", is_active: true }),
});
if (!profileResponse.ok) {
  console.error(`Auth user created, but admin profile failed (${profileResponse.status}). Complete the profile manually before login.`);
  process.exit(1);
}
console.log(`Admin ${email} created.`);
