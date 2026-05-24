import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  EmbedBuilder,
  GuildMember,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { prisma, Cart, Event } from "@discord-manager/database";
import { BotClient } from "../client";
import { emitWsEvent } from "../api/wsServer";

type CartWithEvent = Cart & { event: Event };

export async function getOrCreateTicket(
  client: BotClient,
  member: GuildMember,
  cart: CartWithEvent,
) {
  const guild = member.guild;
  const guildRecord = await prisma.guild.findUnique({ where: { discordId: guild.id } });

  let userRecord = await prisma.user.findUnique({ where: { discordId: member.id } });
  if (!userRecord) {
    userRecord = await prisma.user.create({
      data: {
        discordId: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.avatar,
      },
    });
  }

  let ticket = await prisma.ticket.findFirst({
    where: { userId: userRecord.id, status: "OPEN" },
  });

  let channel: TextChannel;

  if (ticket) {
    channel = guild.channels.cache.get(ticket.discordChannelId) as TextChannel;
    if (!channel) {
      // Channel deleted, close old ticket and create new
      await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "CLOSED" } });
      ticket = null as any;
    }
  }

  if (!ticket) {
    const settings = await prisma.guildSettings.findUnique({ where: { guildId: guildRecord!.id } });

    const ticketName = `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    const createOptions: any = {
      name: ticketName,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          type: OverwriteType.Member,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
      ],
    };

    if (settings?.ticketCategoryId) {
      createOptions.parent = settings.ticketCategoryId;
    }

    if (guildRecord?.staffRoleId) {
      createOptions.permissionOverwrites.push({
        id: guildRecord.staffRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
    }

    channel = await guild.channels.create(createOptions) as TextChannel;

    ticket = await prisma.ticket.create({
      data: {
        userId: userRecord.id,
        discordChannelId: channel.id,
        status: "OPEN",
      },
    });

    await prisma.log.create({
      data: {
        guildId: guildRecord!.id,
        action: "TICKET_CREATED",
        actorId: userRecord.id,
        ticketId: ticket.id,
        message: `Ticket créé pour ${member.user.username}`,
      },
    });

    emitWsEvent({ type: "ticket:created", payload: ticket, timestamp: new Date().toISOString() });

    const welcomeEmbed = new EmbedBuilder()
      .setTitle("🎫 Ticket Ouvert")
      .setDescription(`Bienvenue ${member}, voici ton ticket privé. Tous tes carts claim arriveront ici.`)
      .setColor(0x5865f2)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket_close:${ticket.id}`).setLabel("Close").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`ticket_call_staff:${ticket.id}`).setLabel("Call Staff").setStyle(ButtonStyle.Secondary),
    );

    await channel.send({ embeds: [welcomeEmbed], components: [row] });
  }

  // Send cart to ticket
  await sendCartToTicket(channel, cart, member);

  return { ticket, channel };
}

async function sendCartToTicket(channel: TextChannel, cart: CartWithEvent, member: GuildMember) {
  const embed = new EmbedBuilder()
    .setTitle(`🛒 Cart Claim — ${cart.title}`)
    .setColor(0x57f287)
    .addFields(
      { name: "Event", value: cart.event.name, inline: true },
      { name: "Site", value: cart.site ?? "—", inline: true },
      { name: "Prix", value: cart.price ? `${cart.price}€` : "—", inline: true },
      { name: "Quantité", value: String(cart.quantity), inline: true },
      { name: "PAS", value: cart.event.pasText ?? (cart.event.pasAmount ? `${cart.event.pasAmount}€ each` : "—"), inline: true },
    );

  if (cart.checkoutLink) {
    embed.addFields({ name: "🔗 Checkout", value: `[Accéder au checkout](${cart.checkoutLink})`, inline: false });
  }

  if (cart.expirationAt) {
    const diff = Math.round((cart.expirationAt.getTime() - Date.now()) / 60000);
    embed.addFields({ name: "⏰ Expiration", value: `${diff} min`, inline: true });
  }

  if (cart.image) embed.setImage(cart.image);
  embed.setTimestamp().setFooter({ text: `Cart #${cart.id.slice(0, 8)}` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`cart_paid:${cart.id}`).setLabel("Mark Paid").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`cart_cancel:${cart.id}`).setLabel("Cancel").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket_add_note:${cart.id}`).setLabel("Add Note").setStyle(ButtonStyle.Secondary),
  );

  await channel.send({ content: `${member}`, embeds: [embed], components: [row] });
}

export async function closeTicket(client: BotClient, ticketId: string, closedById: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { user: true } });
  if (!ticket || ticket.status !== "OPEN") return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "CLOSED", closedById, closedAt: new Date() },
  });

  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
  if (guild) {
    const channel = guild.channels.cache.get(ticket.discordChannelId) as TextChannel;
    if (channel) {
      await channel.send("🔒 Ce ticket a été fermé. Il sera archivé dans 24h.");
      setTimeout(() => channel.delete().catch(() => {}), 24 * 60 * 60 * 1000);
    }
  }

  emitWsEvent({ type: "ticket:closed", payload: { ticketId }, timestamp: new Date().toISOString() });
}
