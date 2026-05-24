import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { prisma, Cart, Event } from "@discord-manager/database";
import { EMBED_COLORS } from "@discord-manager/shared";
import { BotClient } from "../client";
import { emitWsEvent } from "../api/wsServer";

type CartWithEvent = Cart & { event: Event };

export interface EmbedTemplate {
  title?: string;
  mentionRoleId?: string;
  showSite?: boolean;
  showPrice?: boolean;
  showQuantity?: boolean;
  showPas?: boolean;
  showCategory?: boolean;
  showSection?: boolean;
  showCheckout?: boolean;
  showExpiration?: boolean;
  showImage?: boolean;
  footerText?: string;
}

export function buildPublicEmbed(cart: CartWithEvent, tpl: EmbedTemplate = {}): EmbedBuilder {
  const { event } = cart;
  const color = parseInt((event.embedColor ?? "#5865F2").replace("#", ""), 16);

  const titleTemplate = tpl.title ?? "🎫 Nouveau Cart — {eventName}";
  const title = titleTemplate
    .replace("{eventName}", event.name)
    .replace("{site}", cart.site ?? event.site ?? "")
    .replace("{price}", cart.price != null ? `${cart.price}€` : "")
    .replace("{quantity}", String(cart.quantity));

  const embed = new EmbedBuilder().setTitle(title).setColor(color);

  const fields: { name: string; value: string; inline: boolean }[] = [];

  fields.push({ name: "Event", value: event.name, inline: true });

  if (tpl.showSite !== false && (cart.site ?? event.site)) {
    fields.push({ name: "Site", value: cart.site ?? event.site ?? "—", inline: true });
  }

  if (tpl.showPrice !== false) {
    fields.push({ name: "Prix", value: cart.price != null ? `${cart.price}€` : "—", inline: true });
  }

  if (tpl.showQuantity !== false) {
    fields.push({ name: "Quantité", value: String(cart.quantity), inline: true });
  }

  if (tpl.showPas !== false && (event.pasText ?? event.pasAmount)) {
    fields.push({ name: "PAS", value: event.pasText ?? (event.pasAmount ? `${event.pasAmount}€ each` : "—"), inline: true });
  }

  if (tpl.showCategory !== false && cart.category) {
    fields.push({ name: "Catégorie", value: cart.category, inline: true });
  }

  if (tpl.showSection !== false && cart.section) {
    fields.push({ name: "Section", value: cart.section, inline: true });
  }

  if (cart.row) {
    fields.push({ name: "Rang", value: cart.row, inline: true });
  }

  if (tpl.showExpiration !== false && cart.expirationAt) {
    const diff = Math.round((cart.expirationAt.getTime() - Date.now()) / 60000);
    if (diff > 0) fields.push({ name: "⏰ Expiration", value: `${diff} min`, inline: true });
  }

  if (tpl.showCheckout !== false && cart.checkoutLink) {
    fields.push({ name: "🔗 Checkout", value: `[Accéder](${cart.checkoutLink})`, inline: false });
  }

  embed.addFields(fields);

  if (tpl.showImage !== false && cart.image) embed.setImage(cart.image);

  const footer = tpl.footerText
    ? tpl.footerText.replace("{cartId}", cart.id.slice(0, 8))
    : `Cart #${cart.id.slice(0, 8)}`;

  embed.setTimestamp().setFooter({ text: footer });

  return embed;
}

export async function repostCart(client: BotClient, cart: CartWithEvent) {
  const { event } = cart;
  if (!event.publicChannelId) return;

  const channel = client.channels.cache.get(event.publicChannelId) as TextChannel;
  if (!channel) return;

  const tpl = (event.embedTemplate ?? {}) as EmbedTemplate;
  const embed = buildPublicEmbed(cart, tpl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`claim_cart:${cart.id}`)
      .setLabel("Claim Cart")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🛒"),
  );

  // Optional role mention
  const content = tpl.mentionRoleId ? `<@&${tpl.mentionRoleId}>` : undefined;

  const msg = await channel.send({ content, embeds: [embed], components: [row] });

  await prisma.cart.update({
    where: { id: cart.id },
    data: { publicMessageId: msg.id, status: "AVAILABLE", claimedById: null },
  });

  await prisma.log.create({
    data: {
      guildId: event.guildId,
      action: "CART_REPOSTED",
      cartId: cart.id,
      eventId: event.id,
      message: `Cart transféré dans #${channel.name}`,
    },
  });

  emitWsEvent({ type: "cart:new", payload: cart, timestamp: new Date().toISOString() });
}

export async function expireCart(client: BotClient, cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { event: true },
  });
  if (!cart || cart.status !== "AVAILABLE") return;

  await prisma.cart.update({ where: { id: cartId }, data: { status: "EXPIRED" } });

  if (cart.event.publicChannelId && cart.publicMessageId) {
    try {
      const channel = client.channels.cache.get(cart.event.publicChannelId) as TextChannel;
      const msg = await channel?.messages.fetch(cart.publicMessageId);
      if (msg) {
        const embed = EmbedBuilder.from(msg.embeds[0]).setColor(EMBED_COLORS.ERROR).setTitle("❌ Cart Expiré");
        await msg.edit({ embeds: [embed], components: [] });
      }
    } catch {}
  }

  emitWsEvent({ type: "cart:expired", payload: { cartId }, timestamp: new Date().toISOString() });
}
