import {
  ChannelType,
  Guild,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { prisma } from "@discord-manager/database";
import type { CreateEventPayload } from "@discord-manager/shared";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createEventWithChannels(
  guild: Guild,
  payload: CreateEventPayload,
) {
  const slug = slugify(payload.name);

  const guildRecord = await prisma.guild.findUnique({ where: { discordId: guild.id } });
  if (!guildRecord) throw new Error("Guild not found in database");

  const existing = await prisma.event.findUnique({ where: { guildId_slug: { guildId: guildRecord.id, slug } } });
  if (existing) throw new Error(`Un event avec le slug "${slug}" existe déjà.`);

  // Create Discord channels
  const everyoneRole = guild.roles.everyone;
  const staffRoleId = guildRecord.staffRoleId;

  const staffAllow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory];
  const privatePerms: any[] = [
    { id: everyoneRole, deny: [PermissionFlagsBits.ViewChannel] },
  ];
  if (staffRoleId) privatePerms.push({ id: staffRoleId, allow: staffAllow });

  const publicPerms: any[] = [
    { id: everyoneRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
  ];
  if (payload.allowedRoleId) {
    // restrict view to allowed role
    publicPerms[0] = { id: everyoneRole, deny: [PermissionFlagsBits.ViewChannel] };
    publicPerms.push({ id: payload.allowedRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] });
  }

  const sourceChannel = await guild.channels.create({
    name: `${slug}-source`,
    type: ChannelType.GuildText,
    permissionOverwrites: privatePerms,
  }) as TextChannel;

  const publicChannel = await guild.channels.create({
    name: `${slug}-carts`,
    type: ChannelType.GuildText,
    permissionOverwrites: publicPerms,
  }) as TextChannel;

  const logsChannel = await guild.channels.create({
    name: `${slug}-logs`,
    type: ChannelType.GuildText,
    permissionOverwrites: privatePerms,
  }) as TextChannel;

  let privateChannel: TextChannel | null = null;
  if (payload.mode !== "PUBLIC") {
    privateChannel = await guild.channels.create({
      name: `${slug}-private`,
      type: ChannelType.GuildText,
      permissionOverwrites: privatePerms,
    }) as TextChannel;
  }

  // Create webhook in source channel
  const webhook = await sourceChannel.createWebhook({
    name: `${payload.name} Source`,
    reason: `Event created: ${payload.name}`,
  });

  const event = await prisma.event.create({
    data: {
      guildId: guildRecord.id,
      name: payload.name,
      slug,
      site: payload.site,
      image: payload.image,
      pasAmount: payload.pasAmount,
      pasText: payload.pasText,
      embedColor: payload.embedColor ?? "#5865F2",
      mode: payload.mode,
      allowedRoleId: payload.allowedRoleId,
      defaultExpiresIn: payload.defaultExpiresIn,
      publicChannelId: publicChannel.id,
      sourceChannelId: sourceChannel.id,
      logsChannelId: logsChannel.id,
      privateChannelId: privateChannel?.id,
      webhookId: webhook.id,
      webhookUrl: webhook.url,
      status: "ACTIVE",
    },
  });

  await prisma.ticketCategory.create({
    data: {
      guildId: guildRecord.id,
      eventId: event.id,
      name: `🎫 ${payload.name} Tickets`,
    },
  });

  return { event, webhook };
}
