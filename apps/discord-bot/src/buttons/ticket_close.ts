import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { closeTicket } from "../services/ticketService";
import { hasPermission } from "../utils/permissions";

export const customId = "ticket_close";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  await interaction.deferReply({ ephemeral: true });
  const ticketId = args[0];

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return interaction.editReply("❌ Ticket introuvable.");

  const isStaff = hasPermission(interaction.member, "STAFF");
  const isOwner = ticket.userId === (await prisma.user.findUnique({ where: { discordId: interaction.user.id } }))?.id;

  if (!isStaff && !isOwner) return interaction.editReply("❌ Pas la permission.");

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  await closeTicket(client, ticketId, user?.id ?? "unknown");
  await interaction.editReply("✅ Ticket fermé.");
}
