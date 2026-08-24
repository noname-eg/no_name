import "dotenv/config";
import { stdin as input, stdout as output } from "node:process";
import { hashPassword } from "../server/auth";

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
        } else if (character === "\u007f") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };
    input.resume();
    input.setRawMode?.(true);
    input.on("data", onData);
  });
}

const username = process.argv[2]?.trim();
if (!username) {
  console.error("Usage: pnpm admin:create <username>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const password = await readSecret("Password: ");
const confirmation = await readSecret("Confirm password: ");

if (password.length < 12 || password !== confirmation) {
  console.error("Passwords must match and be at least 12 characters.");
  process.exit(1);
}

const response = await fetch(`${supabaseUrl}/rest/v1/admin_users?on_conflict=username`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify({ username, password_hash: await hashPassword(password), role: "admin", is_active: true }),
});

if (!response.ok) {
  console.error(`Unable to create admin (${response.status}).`);
  process.exit(1);
}

console.log(`Admin ${username} created.`);
