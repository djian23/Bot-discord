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
import { sendLog } from "./logService";

type CartWithEvent = Cart & { event: Event };

export async function repostCart(client: BotClient, cart: CartWithEvent) {
  const { event } = cart;
  if (!event.publicChannelId) return;

  const channel = client.channels.cache.get(event.publicChannelId) as TextChannel;
  if (!channel) return;

  const color = parseInt((event.embedColor ?? "#5865F2").replace("#", ""), 16);

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Nouveau Cart Disponible`)
    .setColor(color)
    .addFields(
      { name: "Event", value: event.name, inline: true },
      { name: "Site", value: cart.site ?? event.site ?? "—", inline: true },
      { name: "Prix", value: cart.price ? `${cart.price}€` : "—", inline: true },
      { name: "Quantité", value: String(cart.quantity), inline: true },
      { name: "PAS", value: event.pasText ?? (event.pasAmount ? `${event.pasAmount}€ each` : "—"), inline: true },
    );

  if (cart.expirationAt) {
    const diff = Math.round((cart.expirationAt.getTime() - Date.now()) / 60000);
    embed.addFields({ name: "Expiration", value: `${diff} min`, inline: true });
  }

  if (cart.image) embed.setImage(cart.image);
  embed.setTimestamp().setFooter({ text: `Cart #${cart.id.slice(0, 8)}` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`claim_cart:${cart.id}`)
      .setLabel("Claim Cart")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🛒"),
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });

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
      message: `Cart reposté dans #${channel.name}`,
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
