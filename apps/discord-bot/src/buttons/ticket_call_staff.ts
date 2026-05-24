import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { sendLog } from "../services/logService";
import { EMBED_COLORS } from "@discord-manager/shared";

export const customId = "ticket_call_staff";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  await interaction.deferReply({ ephemeral: true });
  const ticketId = args[0];

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { user: true } });
  if (!ticket) return interaction.editReply("❌ Ticket introuvable.");

  const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });

  const embed = new EmbedBuilder()
    .setTitle("🔔 Staff Appelé")
    .setColor(EMBED_COLORS.WARNING)
    .addFields(
      { name: "Ticket", value: `<#${ticket.discordChannelId}>`, inline: true },
      { name: "User", value: `<@${ticket.user.discordId}>`, inline: true },
    )
    .setTimestamp();

  if (guild?.staffLogsChannelId) {
    await sendLog(client, guild.staffLogsChannelId, embed);
  }

  if (guild?.staffRoleId) {
    await interaction.channel?.send(`<@&${guild.staffRoleId}> — Assistance demandée dans ce ticket.`);
  } else {
    await interaction.channel?.send("🔔 Assistance staff demandée.");
  }

  await interaction.editReply("✅ Staff notifié !");
}
