import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { hasPermission } from "../utils/permissions";

export const customId = "cart_discard";

export async function execute(interaction: ButtonInteraction, _client: BotClient, args: string[]) {
  if (!hasPermission(interaction.member as any, "STAFF")) {
    return interaction.reply({ content: "❌ Réservé au staff.", ephemeral: true });
  }

  const cartId = args[0];
  if (!cartId) return interaction.reply({ content: "❌ Cart ID manquant.", ephemeral: true });

  await interaction.deferUpdate();

  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart || cart.status !== "DRAFT") {
    return interaction.followUp({ content: "❌ Cart introuvable ou déjà traité.", ephemeral: true });
  }

  await prisma.cart.update({
    where: { id: cartId },
    data: { status: "CANCELLED" },
  });

  await interaction.message.delete().catch(() => {});
}
