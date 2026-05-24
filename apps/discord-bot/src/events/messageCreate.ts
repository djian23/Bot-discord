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
import { repostCart } from "../services/cartService";

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
      status: "AVAILABLE",
    },
    include: { event: true },
  });

  // Auto-transfer to public channel immediately
  await repostCart(client, cart as any);

  await prisma.log.create({
    data: {
      guildId: event.guildId,
      action: "CART_RECEIVED",
      cartId: cart.id,
      eventId: event.id,
      message: `Cart reçu et transféré : ${cart.title}`,
    },
  });

  // Post source control panel so staff can edit/cancel after the fact
  const sourceChannel = client.channels.cache.get(message.channelId) as TextChannel;
  if (!sourceChannel) return;

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
