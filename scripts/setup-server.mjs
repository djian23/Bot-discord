/**
 * Standalone Discord server setup script.
 * Deletes ALL existing channels then rebuilds from template.
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
  if (res.status === 429) {
    const data = await res.json();
    const wait = (data.retry_after ?? 1) * 1000 + 200;
    console.log(`  ⏳ Rate limit — attente ${Math.round(wait / 1000)}s...`);
    await sleep(wait);
    return api(method, path, body);
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Discord API ${method} ${path} → ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// ── Permission helpers ─────────────────────────────────────────────────────
const VIEW_PERM = 1024n;
const SEND_PERM = 2048n;
const READ_PERM  = 65536n;

function buildPerms(everyoneId, role, isPrivate) {
  if (isPrivate) {
    return [{ id: everyoneId, type: 0, deny: String(VIEW_PERM) }];
  }
  if (role === "announcement" || role === "readonly") {
    return [{
      id: everyoneId,
      type: 0,
      allow: String(VIEW_PERM | READ_PERM),
      deny: String(SEND_PERM),
    }];
  }
  // Open channel — no overwrite needed (inherits guild defaults)
  return [];
}

// ── Step 1: Delete all channels ────────────────────────────────────────────
async function deleteAllChannels() {
  console.log("🗑️  Récupération des salons existants...");
  const channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
  console.log(`   ${channels.length} salon(s) trouvé(s)`);

  // Delete text channels first, then categories (can't delete non-empty categories)
  const texts = channels.filter((c) => c.type !== 4);
  const cats  = channels.filter((c) => c.type === 4);

  console.log("🗑️  Suppression des salons texte...");
  for (const ch of texts) {
    try {
      await api("DELETE", `/channels/${ch.id}`);
      process.stdout.write(`   ✅ #${ch.name} supprimé\n`);
      await sleep(350);
    } catch (err) {
      process.stdout.write(`   ❌ #${ch.name}: ${err.message}\n`);
    }
  }

  console.log("🗑️  Suppression des catégories...");
  for (const ch of cats) {
    try {
      await api("DELETE", `/channels/${ch.id}`);
      process.stdout.write(`   ✅ 📁 ${ch.name} supprimée\n`);
      await sleep(350);
    } catch (err) {
      process.stdout.write(`   ❌ 📁 ${ch.name}: ${err.message}\n`);
    }
  }
}

// ── Step 2: Build server from template ────────────────────────────────────
async function buildServer() {
  const everyoneId = GUILD_ID;
  let created = 0;

  for (const section of TEMPLATE) {
    console.log(`\n📁 ${section.categoryName}`);

    const category = await api("POST", `/guilds/${GUILD_ID}/channels`, {
      name: section.categoryName,
      type: 4,
    });
    await sleep(400);

    for (const ch of section.channels) {
      try {
        await api("POST", `/guilds/${GUILD_ID}/channels`, {
          name: ch.name,
          type: 0,
          parent_id: category.id,
          permission_overwrites: buildPerms(everyoneId, ch.role, ch.private),
        });
        process.stdout.write(`   ✅ #${ch.name}\n`);
        created++;
        await sleep(350);
      } catch (err) {
        process.stdout.write(`   ❌ #${ch.name}: ${err.message}\n`);
      }
    }
  }

  return created;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Discord Server Setup — RESET COMPLET\n");

  await deleteAllChannels();

  console.log("\n🏗️  Construction de la nouvelle structure...");
  const created = await buildServer();

  console.log(`\n🎉 Terminé — ${created} salons créés`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
