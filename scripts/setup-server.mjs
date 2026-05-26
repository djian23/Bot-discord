/**
 * Standalone Discord server setup script.
 * Run with: node scripts/setup-server.mjs
 * Requires DISCORD_TOKEN and DISCORD_GUILD_ID in .env (root)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env ──────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
    if (m) process.env[m[1]] = m[2];
  }
} catch {
  console.error("❌ .env file not found at project root");
  process.exit(1);
}

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.error("❌ DISCORD_TOKEN and DISCORD_GUILD_ID must be set in .env");
  process.exit(1);
}

// ── Discord REST helper ────────────────────────────────────────────────────
const BASE = "https://discord.com/api/v10";
const HEADERS = {
  Authorization: `Bot ${TOKEN}`,
  "Content-Type": "application/json",
};

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Discord API ${method} ${path} → ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Server template ────────────────────────────────────────────────────────
const TEMPLATE = [
  {
    section: "IMPORTANT",
    categoryName: "📌 IMPORTANT",
    channels: [
      { name: "welcome" },
      { name: "annonces", role: "announcement" },
      { name: "giveaway" },
      { name: "interest-check" },
      { name: "roles", role: "readonly" },
      { name: "legit-check" },
      { name: "support-ticket" },
      { name: "success" },
      { name: "partners" },
      { name: "rules", role: "readonly" },
    ],
  },
  {
    section: "CARTS",
    categoryName: "🛒 CARTS / ACO",
    channels: [
      { name: "cart-source", private: true },
      { name: "cart-public", role: "readonly" },
      { name: "cart-public-2", role: "readonly" },
      { name: "claim-cart" },
      { name: "clear-cookies" },
      { name: "drop-ticketmaster", role: "readonly" },
      { name: "drop-psg", role: "readonly" },
      { name: "drop-concert", role: "readonly" },
      { name: "other-event" },
    ],
  },
  {
    section: "EVENTS",
    categoryName: "🎟️ EVENTS",
    channels: [
      { name: "psg", role: "readonly" },
      { name: "om", role: "readonly" },
      { name: "roland-garros", role: "readonly" },
      { name: "concerts", role: "readonly" },
      { name: "ticketmaster", role: "readonly" },
      { name: "fnac", role: "readonly" },
      { name: "other", role: "readonly" },
    ],
  },
  {
    section: "TOOLS",
    categoryName: "🧰 TOOLS / SERVICES",
    channels: [
      { name: "extension" },
      { name: "guide-cart" },
      { name: "guide-ticketmaster" },
      { name: "clear-cookies-guide" },
      { name: "gen-account" },
      { name: "gen-mail" },
      { name: "gen-signup" },
      { name: "proxies" },
      { name: "scraper" },
      { name: "tools-status", role: "announcement" },
    ],
  },
  {
    section: "GENERAL",
    categoryName: "💬 GENERAL",
    channels: [
      { name: "chat" },
      { name: "questions" },
      { name: "my-stats" },
      { name: "cmd" },
      { name: "announcements-input", role: "announcement" },
      { name: "suggestions" },
      { name: "updates", role: "announcement" },
    ],
  },
  {
    section: "MARKETPLACE",
    categoryName: "🛍️ MARKETPLACE",
    channels: [
      { name: "achat" },
      { name: "vente" },
      { name: "wtb" },
      { name: "wts" },
      { name: "trade" },
      { name: "mandatory-price", role: "readonly" },
      { name: "market-legit", role: "readonly" },
    ],
  },
  {
    section: "STAFF",
    categoryName: "🔒 STAFF",
    channels: [
      { name: "webhook-logs", private: true },
      { name: "success-logs", private: true },
      { name: "staff-logs", private: true },
      { name: "error-logs", private: true },
      { name: "claim-logs", private: true },
      { name: "test-webhooks", private: true },
      { name: "analytics-staff", private: true },
      { name: "mod-logs", private: true },
    ],
  },
];

// ── Permission builders ────────────────────────────────────────────────────
const VIEW = "1024";
const SEND = "2048";
const READ_HISTORY = "65536";

function perms(everyoneId, role, isPrivate) {
  if (isPrivate) {
    // Hidden from @everyone
    return [{ id: everyoneId, type: 0, deny: VIEW }];
  }
  if (role === "announcement") {
    // View + read, no send for everyone
    return [{ id: everyoneId, type: 0, allow: String(BigInt(VIEW) | BigInt(READ_HISTORY)), deny: SEND }];
  }
  if (role === "readonly") {
    return [{ id: everyoneId, type: 0, allow: String(BigInt(VIEW) | BigInt(READ_HISTORY)), deny: SEND }];
  }
  // Default: open channel
  return [];
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Fetching current server channels...");
  const existing = await api("GET", `/guilds/${GUILD_ID}/channels`);
  const everyoneId = GUILD_ID; // @everyone role ID = guild ID

  const existingByName = new Map();
  for (const ch of existing) {
    existingByName.set(ch.name.toLowerCase(), ch);
  }

  let created = 0;
  let skipped = 0;

  for (const section of TEMPLATE) {
    console.log(`\n📁 ${section.categoryName}`);

    // Create or find category
    let category = existingByName.get(section.categoryName.toLowerCase());
    if (!category) {
      // Try matching just by emoji + name without case sensitivity
      category = existing.find(
        (c) => c.type === 4 && c.name.toLowerCase().includes(section.categoryName.toLowerCase().replace(/[^\w\s]/g, "").trim())
      );
    }

    if (!category) {
      category = await api("POST", `/guilds/${GUILD_ID}/channels`, {
        name: section.categoryName,
        type: 4,
      });
      console.log(`  ✅ Catégorie créée: ${section.categoryName}`);
      created++;
      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 300));
    } else {
      console.log(`  ⏭️  Catégorie existante: ${category.name}`);
      skipped++;
    }

    // Create channels under this category
    for (const ch of section.channels) {
      const existingCh = existingByName.get(ch.name.toLowerCase());
      if (existingCh) {
        process.stdout.write(`  ⏭️  #${ch.name}\n`);
        skipped++;
        continue;
      }

      try {
        await api("POST", `/guilds/${GUILD_ID}/channels`, {
          name: ch.name,
          type: 0,
          parent_id: category.id,
          permission_overwrites: perms(everyoneId, ch.role, ch.private),
        });
        process.stdout.write(`  ✅ #${ch.name}\n`);
        created++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        process.stdout.write(`  ❌ #${ch.name}: ${err.message}\n`);
      }
    }
  }

  console.log(`\n🎉 Terminé — ${created} créés, ${skipped} ignorés (déjà existants)`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
