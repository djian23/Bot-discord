import { Events, Message } from "discord.js";
import { BotClient } from "../client";
import { prisma } from "@discord-manager/database";
import { parseCartFromEmbed } from "../services/cartParser";
import { repostCart } from "../services/cartService";

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message, client: BotClient) {
  // Only process webhook messages
  if (!message.webhookId) return;
  if (message.author.bot && !message.webhookId) return;

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

  await repostCart(client, cart);

  await prisma.log.create({
    data: {
      guildId: event.guildId,
      action: "CART_RECEIVED",
      cartId: cart.id,
      eventId: event.id,
      message: `Cart reçu : ${cart.title}`,
    },
  });
}
