import {
  ChannelType,
  Guild as DiscordGuild,
  OverwriteType,
  PermissionFlagsBits,
  CategoryChannel,
  TextChannel,
} from "discord.js";
import { prisma } from "@discord-manager/database";
import type { Guild } from "@discord-manager/database";
import { BotClient } from "../client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface TemplateChannel {
  slug: string;
  name: string;
  role?: string;
  isPrivate?: boolean;
}

export interface TemplateSection {
  section: string;
  categoryName: string;
  channels: TemplateChannel[];
}

// ─────────────────────────────────────────────────────────────
// SERVER TEMPLATE
// ─────────────────────────────────────────────────────────────

export const SERVER_TEMPLATE: TemplateSection[] = [
  {
    section: "IMPORTANT",
    categoryName: "📌 IMPORTANT",
    channels: [
      { slug: "welcome", name: "welcome" },
      { slug: "annonces", name: "annonces", role: "announcement" },
      { slug: "giveaway", name: "giveaway" },
      { slug: "interest-check", name: "interest-check" },
      { slug: "roles", name: "roles", role: "roles" },
      { slug: "legit-check", name: "legit-check" },
      { slug: "support-ticket", name: "support-ticket" },
      { slug: "success", name: "success" },
      { slug: "partners", name: "partners" },
      { slug: "rules", name: "rules", role: "info" },
    ],
  },
  {
    section: "CARTS",
    categoryName: "🛒 CARTS / ACO",
    channels: [
      { slug: "cart-source", name: "cart-source", role: "source", isPrivate: true },
      { slug: "cart-public", name: "cart-public", role: "public" },
      { slug: "cart-public-2", name: "cart-public-2", role: "public" },
      { slug: "claim-cart", name: "claim-cart" },
      { slug: "clear-cookies", name: "clear-cookies" },
      { slug: "drop-ticketmaster", name: "drop-ticketmaster", role: "drop" },
      { slug: "drop-psg", name: "drop-psg", role: "drop" },
      { slug: "drop-concert", name: "drop-concert", role: "drop" },
      { slug: "other-event", name: "other-event" },
    ],
  },
  {
    section: "EVENTS",
    categoryName: "🎟️ EVENTS",
    channels: [
      { slug: "psg", name: "psg", role: "drop" },
      { slug: "om", name: "om", role: "drop" },
      { slug: "roland-garros", name: "roland-garros", role: "drop" },
      { slug: "concerts", name: "concerts", role: "drop" },
      { slug: "ticketmaster", name: "ticketmaster", role: "drop" },
      { slug: "fnac", name: "fnac", role: "drop" },
      { slug: "other", name: "other", role: "drop" },
    ],
  },
  {
    section: "TOOLS",
    categoryName: "🧰 TOOLS / SERVICES",
    channels: [
      { slug: "extension", name: "extension" },
      { slug: "guide-cart", name: "guide-cart" },
      { slug: "guide-ticketmaster", name: "guide-ticketmaster" },
      { slug: "clear-cookies-guide", name: "clear-cookies-guide" },
      { slug: "gen-account", name: "gen-account" },
      { slug: "gen-mail", name: "gen-mail" },
      { slug: "gen-signup", name: "gen-signup" },
      { slug: "proxies", name: "proxies" },
      { slug: "scraper", name: "scraper" },
      { slug: "tools-status", name: "tools-status", role: "announcement" },
    ],
  },
  {
    section: "GENERAL",
    categoryName: "💬 GENERAL",
    channels: [
      { slug: "chat", name: "chat", role: "general" },
      { slug: "questions", name: "questions", role: "general" },
      { slug: "my-stats", name: "my-stats" },
      { slug: "cmd", name: "cmd" },
      { slug: "announcements-input", name: "announcements-input", role: "announcement" },
      { slug: "suggestions", name: "suggestions" },
      { slug: "updates", name: "updates", role: "announcement" },
    ],
  },
  {
    section: "MARKETPLACE",
    categoryName: "🛍️ MARKETPLACE",
    channels: [
      { slug: "achat", name: "achat", role: "marketplace" },
      { slug: "vente", name: "vente", role: "marketplace" },
      { slug: "wtb", name: "wtb", role: "marketplace" },
      { slug: "wts", name: "wts", role: "marketplace" },
      { slug: "trade", name: "trade", role: "marketplace" },
      { slug: "mandatory-price", name: "mandatory-price", role: "info" },
      { slug: "market-legit", name: "market-legit", role: "info" },
    ],
  },
  {
    section: "STAFF",
    categoryName: "🔒 STAFF",
    channels: [
      { slug: "webhook-logs", name: "webhook-logs", role: "logs", isPrivate: true },
      { slug: "success-logs", name: "success-logs", role: "logs", isPrivate: true },
      { slug: "staff-logs", name: "staff-logs", role: "logs", isPrivate: true },
      { slug: "error-logs", name: "error-logs", role: "logs", isPrivate: true },
      { slug: "claim-logs", name: "claim-logs", role: "logs", isPrivate: true },
      { slug: "test-webhooks", name: "test-webhooks", role: "logs", isPrivate: true },
      { slug: "analytics-staff", name: "analytics-staff", role: "logs", isPrivate: true },
      { slug: "mod-logs", name: "mod-logs", role: "logs", isPrivate: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// PERMISSION HELPERS
// ─────────────────────────────────────────────────────────────

function buildPermissionOverwrites(
  discordGuild: DiscordGuild,
  guildRecord: Guild,
  channelRole: string | undefined,
): any[] {
  const everyoneId = discordGuild.roles.everyone.id;
  const staffId = guildRecord.staffRoleId;
  const adminId = guildRecord.adminRoleId;
  const bossId = guildRecord.bossRoleId;
  const vipId = guildRecord.vipRoleId;

  const VIEW = PermissionFlagsBits.ViewChannel;
  const SEND = PermissionFlagsBits.SendMessages;
  const READ = PermissionFlagsBits.ReadMessageHistory;

  const staffEntry = (extra: bigint[] = []) => staffId
    ? [{ id: staffId, type: OverwriteType.Role, allow: [VIEW, SEND, READ, ...extra] }]
    : [];
  const adminEntry = (extra: bigint[] = []) => adminId
    ? [{ id: adminId, type: OverwriteType.Role, allow: [VIEW, SEND, READ, ...extra] }]
    : [];
  const bossEntry = (extra: bigint[] = []) => bossId
    ? [{ id: bossId, type: OverwriteType.Role, allow: [VIEW, SEND, READ, ...extra] }]
    : [];
  const vipEntry = (extra: bigint[] = []) => vipId
    ? [{ id: vipId, type: OverwriteType.Role, allow: [VIEW, READ, ...extra] }]
    : [];

  switch (channelRole) {
    case "source":
    case "logs":
      return [
        { id: everyoneId, type: OverwriteType.Role, deny: [VIEW] },
        ...staffEntry(),
        ...adminEntry(),
        ...bossEntry(),
      ];

    case "public":
    case "drop":
    case "info":
    case "roles":
      return [
        { id: everyoneId, type: OverwriteType.Role, allow: [VIEW, READ], deny: [SEND] },
        ...staffEntry(),
      ];

    case "announcement":
      return [
        { id: everyoneId, type: OverwriteType.Role, allow: [VIEW, READ], deny: [SEND] },
        ...staffEntry(),
        ...adminEntry(),
      ];

    case "general":
    case "marketplace":
      return [
        { id: everyoneId, type: OverwriteType.Role, allow: [VIEW, SEND, READ] },
      ];

    case "vip":
      return [
        { id: everyoneId, type: OverwriteType.Role, deny: [VIEW] },
        ...vipEntry(),
        ...staffEntry(),
      ];

    default:
      // No specific role — allow view + read, deny send for @everyone, staff can do all
      return [
        { id: everyoneId, type: OverwriteType.Role, allow: [VIEW, READ], deny: [SEND] },
        ...staffEntry(),
      ];
  }
}

// ─────────────────────────────────────────────────────────────
// BUILD SECTION
// ─────────────────────────────────────────────────────────────

export async function buildSection(
  client: BotClient,
  discordGuild: DiscordGuild,
  guildRecord: Guild,
  section: string,
  skipExisting = true,
): Promise<{ created: number; skipped: number; errors: number }> {
  const template = SERVER_TEMPLATE.find((s) => s.section === section);
  if (!template) return { created: 0, skipped: 0, errors: 0 };

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Get or create the category in Discord + DB
  let categoryRecord = await prisma.serverCategory.findFirst({
    where: { guildId: guildRecord.id, section },
  });

  let discordCategory: CategoryChannel | null = null;

  if (categoryRecord) {
    const cached = discordGuild.channels.cache.get(categoryRecord.discordId);
    if (cached && cached.type === ChannelType.GuildCategory) {
      discordCategory = cached as CategoryChannel;
    }
  }

  if (!discordCategory) {
    try {
      discordCategory = await discordGuild.channels.create({
        name: template.categoryName,
        type: ChannelType.GuildCategory,
      }) as CategoryChannel;

      if (!categoryRecord) {
        categoryRecord = await prisma.serverCategory.create({
          data: {
            guildId: guildRecord.id,
            discordId: discordCategory.id,
            name: template.categoryName,
            section,
          },
        });
      } else {
        categoryRecord = await prisma.serverCategory.update({
          where: { id: categoryRecord.id },
          data: { discordId: discordCategory.id },
        });
      }
      created++;
    } catch (err) {
      console.error(`[ServerBuilder] Failed to create category ${template.categoryName}:`, err);
      errors++;
      return { created, skipped, errors };
    }
  }

  // Now create channels
  for (const tpl of template.channels) {
    try {
      const dbChannel = await prisma.serverChannel.findFirst({
        where: { guildId: guildRecord.id, slug: tpl.slug, section },
      });

      if (dbChannel) {
        const discordChannel = discordGuild.channels.cache.get(dbChannel.discordId);
        if (discordChannel && skipExisting) {
          skipped++;
          continue;
        }
        // DB record exists but Discord channel is gone — recreate
        const permOverwrites = buildPermissionOverwrites(discordGuild, guildRecord, tpl.role);
        const newChannel = await discordGuild.channels.create({
          name: tpl.name,
          type: ChannelType.GuildText,
          parent: discordCategory.id,
          permissionOverwrites: permOverwrites,
        }) as TextChannel;

        await prisma.serverChannel.update({
          where: { id: dbChannel.id },
          data: {
            discordId: newChannel.id,
            categoryDbId: categoryRecord!.id,
          },
        });
        created++;
      } else {
        // No DB record — create from scratch
        const permOverwrites = buildPermissionOverwrites(discordGuild, guildRecord, tpl.role);
        const newChannel = await discordGuild.channels.create({
          name: tpl.name,
          type: ChannelType.GuildText,
          parent: discordCategory.id,
          permissionOverwrites: permOverwrites,
        }) as TextChannel;

        await prisma.serverChannel.create({
          data: {
            guildId: guildRecord.id,
            categoryDbId: categoryRecord!.id,
            discordId: newChannel.id,
            name: tpl.name,
            slug: tpl.slug,
            channelRole: tpl.role,
            section,
            isPrivate: tpl.isPrivate ?? false,
          },
        });
        created++;
      }
    } catch (err) {
      console.error(`[ServerBuilder] Failed to create channel ${tpl.slug}:`, err);
      errors++;
    }
  }

  return { created, skipped, errors };
}

// ─────────────────────────────────────────────────────────────
// BUILD SERVER STRUCTURE
// ─────────────────────────────────────────────────────────────

export async function buildServerStructure(
  client: BotClient,
  discordGuildId: string,
  sections?: string[],
  skipExisting = true,
): Promise<{ created: number; skipped: number; errors: number }> {
  const discordGuild = client.guilds.cache.get(discordGuildId);
  if (!discordGuild) throw new Error("Guild not in bot cache");

  const guildRecord = await prisma.guild.findUnique({ where: { discordId: discordGuildId } });
  if (!guildRecord) throw new Error("Guild not found in database");

  const sectionsToProcess = sections
    ? SERVER_TEMPLATE.filter((s) => sections.includes(s.section))
    : SERVER_TEMPLATE;

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const sectionDef of sectionsToProcess) {
    const result = await buildSection(client, discordGuild, guildRecord, sectionDef.section, skipExisting);
    totalCreated += result.created;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }

  await prisma.log.create({
    data: {
      guildId: guildRecord.id,
      action: "SERVER_SETUP",
      message: `Server structure built: ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors`,
    },
  });

  return { created: totalCreated, skipped: totalSkipped, errors: totalErrors };
}

// ─────────────────────────────────────────────────────────────
// SCAN SERVER
// ─────────────────────────────────────────────────────────────

export async function scanServer(
  client: BotClient,
  discordGuildId: string,
): Promise<{ updated: number; missing: number; ok: number }> {
  const discordGuild = client.guilds.cache.get(discordGuildId);
  if (!discordGuild) throw new Error("Guild not in bot cache");

  const guildRecord = await prisma.guild.findUnique({ where: { discordId: discordGuildId } });
  if (!guildRecord) throw new Error("Guild not found in database");

  const dbChannels = await prisma.serverChannel.findMany({
    where: { guildId: guildRecord.id },
  });

  let updated = 0;
  let missing = 0;
  let ok = 0;

  for (const dbChannel of dbChannels) {
    const discordChannel = discordGuild.channels.cache.get(dbChannel.discordId);
    if (discordChannel) {
      // Channel exists — check if name changed
      if (discordChannel.name !== dbChannel.name) {
        await prisma.serverChannel.update({
          where: { id: dbChannel.id },
          data: { name: discordChannel.name },
        });
        updated++;
      } else {
        ok++;
      }
    } else {
      missing++;
    }
  }

  return { updated, missing, ok };
}

// ─────────────────────────────────────────────────────────────
// REPAIR SERVER
// ─────────────────────────────────────────────────────────────

export async function repairServer(
  client: BotClient,
  discordGuildId: string,
  sections?: string[],
): Promise<{ repaired: number; errors: number }> {
  const discordGuild = client.guilds.cache.get(discordGuildId);
  if (!discordGuild) throw new Error("Guild not in bot cache");

  const guildRecord = await prisma.guild.findUnique({ where: { discordId: discordGuildId } });
  if (!guildRecord) throw new Error("Guild not found in database");

  const sectionsToRepair = sections ?? SERVER_TEMPLATE.map((s) => s.section);

  let totalRepaired = 0;
  let totalErrors = 0;

  for (const sectionName of sectionsToRepair) {
    const template = SERVER_TEMPLATE.find((s) => s.section === sectionName);
    if (!template) continue;

    for (const tpl of template.channels) {
      const dbChannel = await prisma.serverChannel.findFirst({
        where: { guildId: guildRecord.id, slug: tpl.slug, section: sectionName },
      });

      if (!dbChannel) continue; // never created — use build instead

      const discordChannel = discordGuild.channels.cache.get(dbChannel.discordId);
      if (discordChannel) continue; // still alive

      // Channel is missing — recreate it
      try {
        let categoryRecord = await prisma.serverCategory.findFirst({
          where: { guildId: guildRecord.id, section: sectionName },
        });

        let parentId: string | undefined;
        if (categoryRecord) {
          const cat = discordGuild.channels.cache.get(categoryRecord.discordId);
          if (cat) {
            parentId = cat.id;
          } else {
            // Category also gone — recreate it
            const newCat = await discordGuild.channels.create({
              name: template.categoryName,
              type: ChannelType.GuildCategory,
            }) as CategoryChannel;
            await prisma.serverCategory.update({
              where: { id: categoryRecord.id },
              data: { discordId: newCat.id },
            });
            parentId = newCat.id;
          }
        }

        const permOverwrites = buildPermissionOverwrites(discordGuild, guildRecord, tpl.role);
        const newChannel = await discordGuild.channels.create({
          name: tpl.name,
          type: ChannelType.GuildText,
          parent: parentId,
          permissionOverwrites: permOverwrites,
        }) as TextChannel;

        await prisma.serverChannel.update({
          where: { id: dbChannel.id },
          data: { discordId: newChannel.id },
        });
        totalRepaired++;
      } catch (err) {
        console.error(`[ServerBuilder] Repair failed for ${tpl.slug}:`, err);
        totalErrors++;
      }
    }
  }

  return { repaired: totalRepaired, errors: totalErrors };
}

// ─────────────────────────────────────────────────────────────
// GET SERVER STATUS
// ─────────────────────────────────────────────────────────────

export interface SectionStat {
  total: number;
  created: number;
  status: "complete" | "partial" | "missing";
}

export interface ServerStatus {
  channels: Array<{
    id: string;
    slug: string;
    name: string;
    section: string | null;
    channelRole: string | null;
    discordId: string;
    isEnabled: boolean;
    isPrivate: boolean;
  }>;
  sectionStats: Record<string, SectionStat>;
}

export async function getServerStatus(guildId: string): Promise<ServerStatus> {
  const dbChannels = await prisma.serverChannel.findMany({
    where: { guildId },
    orderBy: [{ section: "asc" }, { name: "asc" }],
  });

  const channelsBySection: Record<string, typeof dbChannels> = {};
  for (const ch of dbChannels) {
    const sec = ch.section ?? "UNKNOWN";
    if (!channelsBySection[sec]) channelsBySection[sec] = [];
    channelsBySection[sec].push(ch);
  }

  const sectionStats: Record<string, SectionStat> = {};

  for (const sectionDef of SERVER_TEMPLATE) {
    const total = sectionDef.channels.length;
    const sectionChannels = channelsBySection[sectionDef.section] ?? [];
    const slugsInDb = new Set(sectionChannels.map((c) => c.slug));
    const created = sectionDef.channels.filter((c) => slugsInDb.has(c.slug)).length;

    let status: "complete" | "partial" | "missing";
    if (created === 0) {
      status = "missing";
    } else if (created === total) {
      status = "complete";
    } else {
      status = "partial";
    }

    sectionStats[sectionDef.section] = { total, created, status };
  }

  return {
    channels: dbChannels.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      section: c.section,
      channelRole: c.channelRole,
      discordId: c.discordId,
      isEnabled: c.isEnabled,
      isPrivate: c.isPrivate,
    })),
    sectionStats,
  };
}
