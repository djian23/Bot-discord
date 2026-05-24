import { ModalSubmitInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";

export async function handleModal(interaction: ModalSubmitInteraction, _client: BotClient) {
  const [prefix, ...args] = interaction.customId.split(":");

  if (prefix === "modal_add_note") {
    await interaction.deferReply({ ephemeral: true });
    const cartId = args[0];
    const content = interaction.fields.getTextInputValue("note_content");

    const ticket = await prisma.ticket.findFirst({
      where: { discordChannelId: interaction.channelId!, status: "OPEN" },
    });
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });

    if (!user) return interaction.editReply("❌ Compte introuvable.");

    if (ticket) {
      await prisma.staffNote.create({
        data: {
          userId: ticket.userId,
          ticketId: ticket.id,
          authorId: user.id,
          content,
        },
      });

      await prisma.ticketLog.create({
        data: {
          ticketId: ticket.id,
          authorId: user.id,
          content: `📝 Note staff : ${content}`,
          isStaff: true,
        },
      });

      await interaction.channel?.send({
        content: `📝 **Note staff ajoutée par ${interaction.user.username}**\n${content}`,
      });
    }

    await interaction.editReply("✅ Note ajoutée.");
    return;
  }
}
