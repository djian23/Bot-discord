import { GuildMember } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";

// Cache of invite uses per guild: guildId -> Map<code, uses>
const inviteCache = new Map<string, Map<string, number>>();

export async function cacheGuildInvites(client: BotClient) {
  for (const [, guild] of client.guilds.cache) {
    try {
      const invites = await guild.invites.fetch();
      const cache = new Map<string, number>();
      for (const [, inv] of invites) cache.set(inv.code, inv.uses ?? 0);
      inviteCache.set(guild.id, cache);
    } catch {}
  }
}

export async function trackInvite(client: BotClient, member: GuildMember) {
  const guild = member.guild;
  const oldCache = inviteCache.get(guild.id) ?? new Map();

  const newInvites = await guild.invites.fetch().catch(() => null);
  if (!newInvites) return;

  const newCache = new Map<string, number>();
  for (const [, inv] of newInvites) newCache.set(inv.code, inv.uses ?? 0);
  inviteCache.set(guild.id, newCache);

  let usedCode: string | null = null;
  for (const [code, uses] of newCache) {
    const oldUses = oldCache.get(code) ?? 0;
    if (uses > oldUses) { usedCode = code; break; }
  }

  if (!usedCode) return;

  const invite = newInvites.get(usedCode);
  if (!invite?.inviter) return;

  const inviterRecord = await prisma.user.findUnique({ where: { discordId: invite.inviter.id } });
  const inviteeRecord = await prisma.user.findUnique({ where: { discordId: member.id } });
  if (!inviterRecord || !inviteeRecord) return;

  await prisma.invite.upsert({
    where: { inviteeId: inviteeRecord.id },
    update: { status: "VALID", leftAt: null },
    create: {
      guildId: guild.id,
      inviterId: inviterRecord.id,
      inviteeId: inviteeRecord.id,
      code: usedCode,
      status: "VALID",
    },
  });

  await prisma.user.update({
    where: { id: inviterRecord.id },
    data: { invitesCount: { increment: 1 } },
  });
}
