import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Voir tes statistiques");

export async function execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
  await interaction.deferReply({ ephemeral: true });

  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
    include: {
      claims: { orderBy: { createdAt: "desc" }, take: 3 },
      tickets: { where: { status: "OPEN" } },
    },
  });

  if (!user) {
    return interaction.editReply("Aucune donnée te concernant pour l'instant.");
  }

  const embed = new EmbedBuilder()
    .setTitle(`📊 Stats de ${interaction.user.username}`)
    .setColor(0x5865f2)
    .addFields(
      { name: "Claims totaux", value: String(user.claimsCount), inline: true },
      { name: "Paid", value: String(user.paidCount), inline: true },
      { name: "Cancelled", value: String(user.cancelledCount), inline: true },
      { name: "Invites", value: String(user.invitesCount), inline: true },
      { name: "Tickets ouverts", value: String(user.tickets.length), inline: true },
      { name: "Rôle", value: user.role, inline: true },
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
