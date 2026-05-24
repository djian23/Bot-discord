import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";

export const customId = "giveaway_enter";

export async function execute(interaction: ButtonInteraction, _client: BotClient, args: string[]) {
  await interaction.deferReply({ ephemeral: true });
  const giveawayId = args[0];

  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway || giveaway.status !== "ACTIVE") {
    return interaction.editReply("❌ Ce giveaway est terminé.");
  }

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) return interaction.editReply("❌ Compte non trouvé.");

  // Role check
  if (giveaway.requiredRoleId && !(interaction.member as any)?.roles?.cache?.has(giveaway.requiredRoleId)) {
    return interaction.editReply("❌ Tu n'as pas le rôle requis.");
  }

  try {
    await prisma.giveawayEntry.create({ data: { giveawayId, userId: user.id } });
    const count = await prisma.giveawayEntry.count({ where: { giveawayId } });
    await interaction.editReply(`✅ Participation enregistrée ! (${count} participants)`);
  } catch {
    await interaction.editReply("✅ Tu participes déjà !");
  }
}
