import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";

export const customId = "interest_vote";

export async function execute(interaction: ButtonInteraction, _client: BotClient, args: string[]) {
  await interaction.deferReply({ ephemeral: true });
  const [checkId, buttonId] = args;

  const check = await prisma.interestCheck.findUnique({ where: { id: checkId } });
  if (!check || !check.isActive) return interaction.editReply("❌ Ce sondage est terminé.");

  const button = await prisma.interestButton.findUnique({ where: { id: buttonId } });
  if (!button) return interaction.editReply("❌ Option introuvable.");

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) return interaction.editReply("❌ Compte introuvable.");

  if (check.requiredRoleId && !(interaction.member as any)?.roles?.cache?.has(check.requiredRoleId)) {
    return interaction.editReply("❌ Tu n'as pas le rôle requis.");
  }

  const existing = await prisma.interestVote.findUnique({
    where: { interestCheckId_userId: { interestCheckId: checkId, userId: user.id } },
  });

  if (existing) {
    await prisma.interestVote.update({
      where: { id: existing.id },
      data: { buttonId },
    });
    await interaction.editReply(`🔄 Vote modifié : **${button.label}**`);
  } else {
    await prisma.interestVote.create({
      data: { interestCheckId: checkId, buttonId, userId: user.id },
    });
    const count = await prisma.interestVote.count({ where: { interestCheckId: checkId, buttonId } });
    await interaction.editReply(`✅ Vote enregistré : **${button.label}** (${count} votes)`);
  }
}
