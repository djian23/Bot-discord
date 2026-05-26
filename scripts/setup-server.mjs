/**
 * Discord server reset + rebuild + DB sync
 * Run: node scripts/setup-server.mjs
 * Requires DISCORD_TOKEN, DISCORD_GUILD_ID, DATABASE_URL in .env
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

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
  console.error("❌ .env introuvable à la racine du projet");
  process.exit(1);
}

const TOKEN       = process.env.DISCORD_TOKEN;
const GUILD_ID    = process.env.DISCORD_GUILD_ID;
const DB_URL      = process.env.DATABASE_URL;

if (!TOKEN || !GUILD_ID) {
  console.error("❌ DISCORD_TOKEN et DISCORD_GUILD_ID requis dans .env");
  process.exit(1);
}

// ── Discord REST ───────────────────────────────────────────────────────────
const BASE = "https://discord.com/api/v10";

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429) {
    const d = await res.json();
    const wait = (d.retry_after ?? 1) * 1000 + 300;
    console.log(`  ⏳ Rate limit — attente ${Math.ceil(wait / 1000)}s...`);
    await sleep(wait);
    return api(method, path, body);
  }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Template ───────────────────────────────────────────────────────────────
const TEMPLATE = [
  {
    section: "IMPORTANT",
    categoryName: "📌 IMPORTANT",
    channels: [
      { slug: "welcome",        name: "welcome" },
      { slug: "annonces",       name: "annonces",        role: "announcement" },
      { slug: "giveaway",       name: "giveaway" },
      { slug: "interest-check", name: "interest-check" },
      { slug: "legit-check",    name: "legit-check" },
      { slug: "support-ticket", name: "support-ticket" },
      { slug: "roles",          name: "roles",           role: "readonly" },
      { slug: "rules",          name: "rules",           role: "readonly" },
    ],
  },
  {
    section: "CARTS",
    categoryName: "🛒 CARTS",
    channels: [
      { slug: "cart-source",         name: "cart-source",         private: true },
      { slug: "cart-psg",            name: "cart-psg",            role: "readonly" },
      { slug: "cart-roland-garros",  name: "cart-roland-garros",  role: "readonly" },
      { slug: "cart-concerts",       name: "cart-concerts",       role: "readonly" },
      { slug: "cart-ticketmaster",   name: "cart-ticketmaster",   role: "readonly" },
      { slug: "cart-fnac",           name: "cart-fnac",           role: "readonly" },
      { slug: "claim-cart",          name: "claim-cart" },
    ],
  },
  {
    section: "TOOLS",
    categoryName: "🧰 TOOLS",
    channels: [
      { slug: "extension",           name: "extension" },
      { slug: "guide-cart",          name: "guide-cart",          role: "readonly" },
      { slug: "guide-ticketmaster",  name: "guide-ticketmaster",  role: "readonly" },
      { slug: "clear-cookies-guide", name: "clear-cookies-guide", role: "readonly" },
      { slug: "gen-account",         name: "gen-account",         role: "readonly" },
      { slug: "gen-mail",            name: "gen-mail",            role: "readonly" },
      { slug: "proxies",             name: "proxies",             role: "readonly" },
      { slug: "tools-status",        name: "tools-status",        role: "announcement" },
    ],
  },
  {
    section: "GENERAL",
    categoryName: "💬 GENERAL",
    channels: [
      { slug: "chat",        name: "chat" },
      { slug: "questions",   name: "questions" },
      { slug: "my-stats",    name: "my-stats" },
      { slug: "suggestions", name: "suggestions" },
      { slug: "updates",     name: "updates",    role: "announcement" },
    ],
  },
  {
    section: "MARKETPLACE",
    categoryName: "🛍️ MARKETPLACE",
    channels: [
      { slug: "wtb",             name: "wtb" },
      { slug: "wts",             name: "wts" },
      { slug: "trade",           name: "trade" },
      { slug: "mandatory-price", name: "mandatory-price", role: "readonly" },
      { slug: "market-legit",    name: "market-legit",    role: "readonly" },
    ],
  },
  {
    section: "STAFF",
    categoryName: "🔒 STAFF",
    channels: [
      { slug: "success-logs",   name: "success-logs",   private: true },
      { slug: "staff-logs",     name: "staff-logs",     private: true },
      { slug: "error-logs",     name: "error-logs",     private: true },
      { slug: "claim-logs",     name: "claim-logs",     private: true },
      { slug: "webhook-logs",   name: "webhook-logs",   private: true },
      { slug: "analytics-staff",name: "analytics-staff",private: true },
      { slug: "mod-logs",       name: "mod-logs",       private: true },
    ],
  },
];

// ── Permissions ────────────────────────────────────────────────────────────
const VIEW = 1024n, SEND = 2048n, READ = 65536n;

function buildPerms(everyoneId, role, isPrivate) {
  if (isPrivate)
    return [{ id: everyoneId, type: 0, deny: String(VIEW) }];
  if (role === "announcement" || role === "readonly")
    return [{ id: everyoneId, type: 0, allow: String(VIEW | READ), deny: String(SEND) }];
  return [];
}

// ── DB sync (optional — requires pg) ──────────────────────────────────────
let db = null;

async function connectDb() {
  if (!DB_URL) return;
  try {
    const { default: pg } = await import("pg");
    const Client = pg.Client ?? pg;
    db = new Client({ connectionString: DB_URL });
    await db.connect();
    console.log("🗄️  Connecté à PostgreSQL\n");
  } catch {
    console.log("⚠️  pg non disponible — sync DB ignorée (npm install pg pour l'activer)\n");
    db = null;
  }
}

function cuid() {
  return "c" + Date.now().toString(36) + randomUUID().replace(/-/g, "").slice(0, 16);
}

async function dbQuery(sql, params) {
  if (!db) return null;
  try {
    return await db.query(sql, params);
  } catch (err) {
    console.error(`   DB error: ${err.message}`);
    return null;
  }
}

async function upsertGuild(guildName) {
  const res = await dbQuery(
    `INSERT INTO "Guild" ("id","discordId","name","createdAt","updatedAt")
     VALUES ($1,$2,$3,NOW(),NOW())
     ON CONFLICT ("discordId") DO UPDATE SET name=$3, "updatedAt"=NOW()
     RETURNING id`,
    [cuid(), GUILD_ID, guildName]
  );
  return res?.rows?.[0]?.id ?? null;
}

async function upsertCategory(guildDbId, discordId, name, section) {
  const res = await dbQuery(
    `INSERT INTO "ServerCategory" ("id","guildId","discordId","name","section")
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT ("discordId") DO UPDATE SET name=$4
     RETURNING id`,
    [cuid(), guildDbId, discordId, name, section]
  );
  return res?.rows?.[0]?.id ?? null;
}

async function upsertChannel(guildDbId, catDbId, discordId, slug, name, section, role, isPrivate) {
  await dbQuery(
    `INSERT INTO "ServerChannel"
       ("id","guildId","categoryDbId","discordId","slug","name","section","channelRole","isPrivate","isEnabled","createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,NOW())
     ON CONFLICT ("discordId") DO UPDATE
       SET "slug"=$5,"name"=$6,"section"=$7,"channelRole"=$8,"isPrivate"=$9`,
    [cuid(), guildDbId, catDbId, discordId, slug, name, section, role ?? null, isPrivate ?? false]
  );
}

// ── Step 1: Delete all channels ────────────────────────────────────────────
async function deleteAll() {
  console.log("🗑️  Récupération des salons existants...");
  const channels = await api("GET", `/guilds/${GUILD_ID}/channels`);
  console.log(`   ${channels.length} salon(s) trouvé(s)\n`);

  const texts = channels.filter((c) => c.type !== 4);
  const cats  = channels.filter((c) => c.type === 4);

  for (const ch of texts) {
    try {
      await api("DELETE", `/channels/${ch.id}`);
      console.log(`   🗑️  #${ch.name}`);
      await sleep(350);
    } catch (e) { console.log(`   ❌ #${ch.name}: ${e.message}`); }
  }
  for (const ch of cats) {
    try {
      await api("DELETE", `/channels/${ch.id}`);
      console.log(`   🗑️  📁 ${ch.name}`);
      await sleep(350);
    } catch (e) { console.log(`   ❌ 📁 ${ch.name}: ${e.message}`); }
  }

  // Clear DB records if connected
  if (db) {
    const g = await dbQuery(`SELECT id FROM "Guild" WHERE "discordId"=$1`, [GUILD_ID]);
    const gId = g?.rows?.[0]?.id;
    if (gId) {
      await dbQuery(`DELETE FROM "ServerChannel" WHERE "guildId"=$1`, [gId]);
      await dbQuery(`DELETE FROM "ServerCategory" WHERE "guildId"=$1`, [gId]);
      console.log("   🗄️  Anciens enregistrements DB supprimés");
    }
  }
}

// ── Step 2: Build ──────────────────────────────────────────────────────────
async function build() {
  // Fetch guild name for DB
  const guildInfo = await api("GET", `/guilds/${GUILD_ID}`);
  const guildName = guildInfo.name ?? "Discord Server";
  const guildDbId = await upsertGuild(guildName);

  let total = 0;

  for (const section of TEMPLATE) {
    console.log(`\n📁 ${section.categoryName}`);

    const cat = await api("POST", `/guilds/${GUILD_ID}/channels`, {
      name: section.categoryName,
      type: 4,
    });
    await sleep(400);

    const catDbId = guildDbId
      ? await upsertCategory(guildDbId, cat.id, section.categoryName, section.section)
      : null;

    for (const ch of section.channels) {
      try {
        const created = await api("POST", `/guilds/${GUILD_ID}/channels`, {
          name: ch.name,
          type: 0,
          parent_id: cat.id,
          permission_overwrites: buildPerms(GUILD_ID, ch.role, ch.private),
        });

        if (guildDbId) {
          await upsertChannel(
            guildDbId, catDbId, created.id,
            ch.slug, ch.name, section.section, ch.role, ch.private
          );
        }

        const icon = ch.private ? "🔒" : "✅";
        console.log(`   ${icon} #${ch.name}${db ? " (synced)" : ""}`);
        total++;
        await sleep(350);
      } catch (e) {
        console.log(`   ❌ #${ch.name}: ${e.message}`);
      }
    }
  }

  return total;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Discord Server Setup — RESET COMPLET\n");

  await connectDb();

  console.log("━━━ ÉTAPE 1 : Suppression ━━━");
  await deleteAll();

  console.log("\n━━━ ÉTAPE 2 : Construction ━━━");
  const count = await build();

  if (db) await db.end();

  console.log(`\n🎉 Terminé — ${count} salons créés${db ? " + synchronisés avec le dashboard" : ""}`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
