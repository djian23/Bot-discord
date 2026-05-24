import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";

export const customId = "role_toggle";

export async function execute(interaction: ButtonInteraction, _client: BotClient, args: string[]) {
  await interaction.deferReply({ ephemeral: true });
  const optionId = args[0];

  const option = await prisma.roleOption.findUnique({ where: { id: optionId } });
  if (!option) return interaction.editReply("❌ Option introuvable.");

  if (option.manualOnly) return interaction.editReply("❌ Ce rôle est attribué manuellement.");

  const member = interaction.member as any;
  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });

  if (!user) return interaction.editReply("❌ Compte introuvable.");

  // Check conditions
  if (option.requiredRoleId && !member?.roles?.cache?.has(option.requiredRoleId)) {
    return interaction.editReply("❌ Rôle requis manquant.");
  }
  if (option.minClaims && user.claimsCount < option.minClaims) {
    return interaction.editReply(`❌ ${option.minClaims} claims requis (tu en as ${user.claimsCount}).`);
  }
  if (option.minPaid && user.paidCount < option.minPaid) {
    return interaction.editReply(`❌ ${option.minPaid} paid requis (tu en as ${user.paidCount}).`);
  }
  if (option.minInvites && user.invitesCount < option.minInvites) {
    return interaction.editReply(`❌ ${option.minInvites} invites requises (tu en as ${user.invitesCount}).`);
  }

  const guild = interaction.guild!;
  const guildMember = await guild.members.fetch(interaction.user.id);
  const hasRole = guildMember.roles.cache.has(option.roleId);

  if (hasRole) {
    await guildMember.roles.remove(option.roleId);
    await interaction.editReply(`✅ Rôle **${option.label}** retiré.`);
  } else {
    await guildMember.roles.add(option.roleId);
    await interaction.editReply(`✅ Rôle **${option.label}** attribué !`);
  }

  const guildRecord = await prisma.guild.findUnique({ where: { discordId: guild.id } });
  await prisma.log.create({
    data: {
      guildId: guildRecord!.id,
      action: hasRole ? "ROLE_REMOVED" : "ROLE_ASSIGNED",
      actorId: user.id,
      message: `${hasRole ? "Retiré" : "Attribué"} le rôle "${option.label}" à ${interaction.user.username}`,
    },
  });
}
