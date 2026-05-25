import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { hasPermission } from "../utils/permissions";
import { getOrCreateTicket } from "../services/ticketService";

export const customId = "cart_review_ticket";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  if (!hasPermission(interaction.member as any, "STAFF")) {
    return interaction.reply({ content: "❌ Réservé au staff.", ephemeral: true });
  }

  const cartId = args[0];
  if (!cartId) return interaction.reply({ content: "❌ Cart ID manquant.", ephemeral: true });

  await interaction.deferReply({ ephemeral: true });

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { event: { include: { distributionSettings: true } } },
  });
  if (!cart) return interaction.editReply("❌ Cart introuvable.");

  const targetUserId = cart.event.distributionSettings?.targetUserId;
  if (!targetUserId) return interaction.editReply("❌ Aucun utilisateur cible configuré pour cet event.");

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) return interaction.editReply("❌ Utilisateur cible introuvable.");

  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
  const member = guild ? await guild.members.fetch(targetUser.discordId).catch(() => null) : null;
  if (!member) return interaction.editReply("❌ Membre introuvable sur le serveur.");

  await getOrCreateTicket(client, member, cart as any);
  await interaction.editReply("✅ Cart envoyé dans le ticket.");
  await interaction.message.edit({ components: [] }).catch(() => {});
}
