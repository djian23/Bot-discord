import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { hasPermission } from "../utils/permissions";
import { repostCart } from "../services/cartService";

export const customId = "cart_review_publish";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  if (!hasPermission(interaction.member as any, "STAFF")) {
    return interaction.reply({ content: "❌ Réservé au staff.", ephemeral: true });
  }

  const cartId = args[0];
  if (!cartId) return interaction.reply({ content: "❌ Cart ID manquant.", ephemeral: true });

  await interaction.deferUpdate();

  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { event: true } });
  if (!cart) return interaction.followUp({ content: "❌ Cart introuvable.", ephemeral: true });

  await repostCart(client, cart as any);
  await interaction.message.edit({ components: [] }).catch(() => {});
}
