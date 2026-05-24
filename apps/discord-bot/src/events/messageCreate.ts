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

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message, client: BotClient) {
  if (!message.webhookId) return;

  const event = await prisma.event.findFirst({
    where: { sourceChannelId: message.channelId, status: "ACTIVE" },
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
      status: "DRAFT",
    },
  });

  await prisma.log.create({
    data: {
      guildId: event.guildId,
      action: "CART_RECEIVED",
      cartId: cart.id,
      eventId: event.id,
      message: `Cart reçu (brouillon) : ${cart.title}`,
    },
  });

  // Post draft preview in source channel for staff review
  const sourceChannel = client.channels.cache.get(message.channelId) as TextChannel;
  if (!sourceChannel) return;

  const color = parseInt((event.embedColor ?? "#5865F2").replace("#", ""), 16);

  const embed = buildDraftEmbed(cart, event, color);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`cart_edit:${cart.id}`)
      .setLabel("Modifier")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✏️"),
    new ButtonBuilder()
      .setCustomId(`cart_publish:${cart.id}`)
      .setLabel("Publier")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🚀"),
    new ButtonBuilder()
      .setCustomId(`cart_discard:${cart.id}`)
      .setLabel("Supprimer")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️"),
  );

  await sourceChannel.send({ embeds: [embed], components: [row] });
}

export function buildDraftEmbed(
  cart: {
    id: string;
    title: string;
    site?: string | null;
    price?: number | null;
    quantity: number;
    section?: string | null;
    row?: string | null;
    category?: string | null;
    checkoutLink?: string | null;
    expirationAt?: Date | null;
    image?: string | null;
  },
  event: {
    name: string;
    site?: string | null;
    pasText?: string | null;
    pasAmount?: number | null;
    embedColor?: string | null;
  },
  color: number,
) {
  const embed = new EmbedBuilder()
    .setTitle(`📋 [BROUILLON] ${cart.title}`)
    .setColor(color)
    .addFields(
      { name: "Event", value: event.name, inline: true },
      { name: "Site", value: cart.site ?? event.site ?? "—", inline: true },
      { name: "Prix", value: cart.price != null ? `${cart.price}€` : "—", inline: true },
      { name: "Quantité", value: String(cart.quantity), inline: true },
      { name: "PAS", value: event.pasText ?? (event.pasAmount ? `${event.pasAmount}€ each` : "—"), inline: true },
    );

  if (cart.category) embed.addFields({ name: "Catégorie", value: cart.category, inline: true });
  if (cart.section) embed.addFields({ name: "Section", value: cart.section, inline: true });
  if (cart.row) embed.addFields({ name: "Rang", value: cart.row, inline: true });

  if (cart.checkoutLink) {
    embed.addFields({ name: "🔗 Checkout", value: `[Lien](${cart.checkoutLink})`, inline: false });
  }

  if (cart.expirationAt) {
    const diff = Math.round((cart.expirationAt.getTime() - Date.now()) / 60000);
    embed.addFields({ name: "Expiration", value: `${diff} min`, inline: true });
  }

  if (cart.image) embed.setImage(cart.image);

  return embed
    .setTimestamp()
    .setFooter({ text: `Cart #${cart.id.slice(0, 8)} · En attente de validation` });
}
