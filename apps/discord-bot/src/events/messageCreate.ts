import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  Message,
  TextChannel,
} from "discord.js";
import { BotClient } from "../client";
import { prisma } from "@discord-manager/database";
import { parseCartFromEmbed } from "../services/cartParser";
import { repostCart, buildPublicEmbed, EmbedTemplate } from "../services/cartService";
import { getOrCreateTicket } from "../services/ticketService";
import { notifyPublicCart, notifyTicketCart } from "../services/pushoverService";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message, client: BotClient) {
  if (!message.webhookId) return;

  const event = await prisma.event.findFirst({
    where: { sourceChannelId: message.channelId, status: "ACTIVE" },
    include: { distributionSettings: true },
  });
  if (!event) return;

  const parsed = parseCartFromEmbed(message);
  if (!parsed) return;

  const cart = await prisma.cart.create({
    data: {
      eventId: event.id,
      sourceMessageId: message.id,
      sourceChannelId: message.channelId,
      title: parsed.title,
      site: parsed.site ?? event.site,
      price: parsed.price,
      quantity: parsed.quantity ?? 1,
      section: parsed.section,
      row: parsed.row,
      category: parsed.category,
      image: parsed.image,
      checkoutLink: parsed.checkoutLink,
      expirationAt: parsed.expirationAt,
      cartExternalId: parsed.cartExternalId,
      status: "AVAILABLE",
    },
    include: { event: true },
  });

  await prisma.log.create({
    data: {
      guildId: event.guildId,
      action: "CART_RECEIVED",
      cartId: cart.id,
      eventId: event.id,
      message: `Cart reçu : ${cart.title}`,
    },
  });

  const mode = event.distributionSettings?.mode ?? event.distributionMode ?? "PUBLIC_CLAIM";

  if (mode === "PUBLIC_CLAIM") {
    // Default: repost to public channel with claim button, notify via Pushover
    await repostCart(client, cart as any);
    await notifyPublicCart(cart.id);

    // Post source control panel
    const sourceChannel = client.channels.cache.get(message.channelId) as TextChannel;
    if (sourceChannel) {
      const color = parseInt((event.embedColor ?? "#5865F2").replace("#", ""), 16);
      const sourceEmbed = new EmbedBuilder()
        .setTitle(`✅ Transféré — ${cart.title}`)
        .setColor(color)
        .addFields(
          { name: "Event", value: event.name, inline: true },
          { name: "Prix", value: cart.price != null ? `${cart.price}€` : "—", inline: true },
          { name: "Quantité", value: String(cart.quantity), inline: true },
        );

      if (cart.category) sourceEmbed.addFields({ name: "Catégorie", value: cart.category, inline: true });
      if (cart.section) sourceEmbed.addFields({ name: "Section", value: cart.section, inline: true });

      sourceEmbed
        .setFooter({ text: `Cart #${cart.id.slice(0, 8)} · Posté dans #${event.publicChannelId}` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`cart_edit:${cart.id}`)
          .setLabel("Modifier")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("✏️"),
        new ButtonBuilder()
          .setCustomId(`cart_discard:${cart.id}`)
          .setLabel("Annuler")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
      );

      await sourceChannel.send({ embeds: [sourceEmbed], components: [row] });
    }
  } else if (mode === "DIRECT_TICKET") {
    // Send cart directly to a specific user's ticket
    const distSettings = event.distributionSettings;
    if (distSettings?.targetUserId) {
      const targetUser = await prisma.user.findUnique({ where: { id: distSettings.targetUserId } });
      if (targetUser) {
        const discordGuild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
        const discordMember = discordGuild
          ? await discordGuild.members.fetch(targetUser.discordId).catch(() => null)
          : null;
        if (discordMember) {
          const { channel } = await getOrCreateTicket(client, discordMember, cart as any);
          if (distSettings.notifyPushover) await notifyTicketCart(targetUser.id, cart.id);
        }
      }
    }
  } else if (mode === "PUBLIC_ONLY") {
    // Post to public channel with NO claim button
    const pubChannel = event.publicChannelId
      ? (client.channels.cache.get(event.publicChannelId) as TextChannel)
      : null;
    if (pubChannel) {
      const tpl = (event.embedTemplate ?? {}) as EmbedTemplate;
      const embed = buildPublicEmbed(cart as any, tpl);
      await pubChannel.send({ embeds: [embed] }); // no components
    }
    await prisma.cart.update({ where: { id: cart.id }, data: { status: "AVAILABLE" } });
  } else if (mode === "STAFF_REVIEW") {
    // Post to staff review channel with action buttons
    const distSettings = event.distributionSettings;
    const reviewChannelId = distSettings?.staffReviewChannelId ?? event.logsChannelId;
    const reviewChannel = reviewChannelId
      ? (client.channels.cache.get(reviewChannelId) as TextChannel)
      : null;

    if (reviewChannel) {
      const color = parseInt((event.embedColor ?? "#5865F2").replace("#", ""), 16);

      const reviewEmbed = new EmbedBuilder()
        .setTitle(`🔍 Review Cart — ${cart.title}`)
        .setColor(color)
        .addFields(
          { name: "Event", value: event.name, inline: true },
          { name: "Prix", value: cart.price != null ? `${cart.price}€` : "—", inline: true },
          { name: "Quantité", value: String(cart.quantity), inline: true },
        );

      if (cart.category) reviewEmbed.addFields({ name: "Catégorie", value: cart.category, inline: true });
      if (cart.section) reviewEmbed.addFields({ name: "Section", value: cart.section, inline: true });
      if (cart.image) reviewEmbed.setImage(cart.image);

      reviewEmbed
        .setFooter({ text: `Cart #${cart.id.slice(0, 8)}` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`cart_review_publish:${cart.id}`)
          .setLabel("Publier")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId(`cart_review_ticket:${cart.id}`)
          .setLabel("Envoyer ticket")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("📩"),
        new ButtonBuilder()
          .setCustomId(`cart_discard:${cart.id}`)
          .setLabel("Supprimer")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
      );

      await reviewChannel.send({ embeds: [reviewEmbed], components: [row] });
    }
  } else {
    // Fallback: default PUBLIC_CLAIM behavior
    await repostCart(client, cart as any);
    await notifyPublicCart(cart.id);

    const sourceChannel = client.channels.cache.get(message.channelId) as TextChannel;
    if (sourceChannel) {
      const color = parseInt((event.embedColor ?? "#5865F2").replace("#", ""), 16);
      const sourceEmbed = new EmbedBuilder()
        .setTitle(`✅ Transféré — ${cart.title}`)
        .setColor(color)
        .addFields(
          { name: "Event", value: event.name, inline: true },
          { name: "Prix", value: cart.price != null ? `${cart.price}€` : "—", inline: true },
          { name: "Quantité", value: String(cart.quantity), inline: true },
        );

      sourceEmbed
        .setFooter({ text: `Cart #${cart.id.slice(0, 8)} · Posté dans #${event.publicChannelId}` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`cart_edit:${cart.id}`)
          .setLabel("Modifier")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("✏️"),
        new ButtonBuilder()
          .setCustomId(`cart_discard:${cart.id}`)
          .setLabel("Annuler")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
      );

      await sourceChannel.send({ embeds: [sourceEmbed], components: [row] });
    }
  }
}
