import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";
import { closeTicket } from "../../services/ticketService";
import { hasPermission } from "../../utils/permissions";

export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Gestion des tickets")
  .addSubcommand((sub) =>
    sub
      .setName("close")
      .setDescription("Fermer un ticket")
      .addStringOption((o) => o.setName("id").setDescription("ID du ticket").setRequired(false)),
  );

export const staffOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const sub = interaction.options.getSubcommand();

  if (sub === "close") {
    await interaction.deferReply({ ephemeral: true });
    const ticketId = interaction.options.getString("id");

    let ticket;
    if (ticketId) {
      ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    } else {
      ticket = await prisma.ticket.findFirst({
        where: { discordChannelId: interaction.channelId, status: "OPEN" },
      });
    }

    if (!ticket) return interaction.editReply("❌ Ticket introuvable.");

    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    await closeTicket(client, ticket.id, user?.id ?? "staff");
    await interaction.editReply("✅ Ticket fermé.");
  }
}
