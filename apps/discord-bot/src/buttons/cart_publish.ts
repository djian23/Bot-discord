import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { repostCart } from "../services/cartService";
import { hasPermission } from "../utils/permissions";

export const customId = "cart_publish";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  if (!hasPermission(interaction.member as any, "STAFF")) {
    return interaction.reply({ content: "❌ Réservé au staff.", ephemeral: true });
  }

  const cartId = args[0];
  if (!cartId) return interaction.reply({ content: "❌ Cart ID manquant.", ephemeral: true });

  await interaction.deferUpdate();

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { event: true },
  });

  if (!cart) {
    return interaction.followUp({ content: "❌ Cart introuvable.", ephemeral: true });
  }

  if (cart.status !== "DRAFT") {
    return interaction.followUp({ content: "❌ Ce cart a déjà été publié ou supprimé.", ephemeral: true });
  }

  await repostCart(client, cart as any);

  // Remove buttons from source preview message once published
  await interaction.message.edit({ components: [] }).catch(() => {});
}
