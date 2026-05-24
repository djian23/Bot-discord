import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";

export const data = new SlashCommandBuilder()
  .setName("user")
  .setDescription("Gestion des utilisateurs")
  .addSubcommand((sub) =>
    sub
      .setName("blacklist")
      .setDescription("Blacklister un utilisateur")
      .addUserOption((o) => o.setName("target").setDescription("Utilisateur").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Raison").setRequired(false)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("unblacklist")
      .setDescription("Retirer un utilisateur de la blacklist")
      .addUserOption((o) => o.setName("target").setDescription("Utilisateur").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("history")
      .setDescription("Voir l'historique d'un utilisateur")
      .addUserOption((o) => o.setName("target").setDescription("Utilisateur").setRequired(true)),
  );

export const staffOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
  const sub = interaction.options.getSubcommand();

  if (sub === "blacklist" || sub === "unblacklist") {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser("target", true);
    const reason = interaction.options.getString("reason") ?? undefined;
    const isBlacklisted = sub === "blacklist";

    await prisma.user.upsert({
      where: { discordId: target.id },
      update: { isBlacklisted, blacklistReason: isBlacklisted ? reason : null },
      create: {
        discordId: target.id,
        username: target.username,
        discriminator: target.discriminator,
        isBlacklisted,
        blacklistReason: reason,
      },
    });

    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
    await prisma.log.create({
      data: {
        guildId: guild!.id,
        action: isBlacklisted ? "USER_BLACKLISTED" : "USER_UNBLACKLISTED",
        targetId: (await prisma.user.findUnique({ where: { discordId: target.id } }))?.id,
        message: `${target.username} ${isBlacklisted ? "blacklisté" : "unblacklisté"} par ${interaction.user.username}. ${reason ? `Raison: ${reason}` : ""}`,
      },
    });

    await interaction.editReply(`✅ ${target.username} ${isBlacklisted ? "blacklisté" : "retiré de la blacklist"}.`);
    return;
  }

  if (sub === "history") {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser("target", true);
    const user = await prisma.user.findUnique({
      where: { discordId: target.id },
      include: { claims: { take: 5, orderBy: { createdAt: "desc" } } },
    });

    if (!user) return interaction.editReply("❌ Utilisateur introuvable en base.");

    const lines = [
      `**${user.username}**`,
      `Rôle : ${user.role}`,
      `Claims : ${user.claimsCount} | Paid : ${user.paidCount} | Cancelled : ${user.cancelledCount}`,
      `Blacklist : ${user.isBlacklisted ? `Oui — ${user.blacklistReason ?? "sans raison"}` : "Non"}`,
      `Derniers claims : ${user.claims.length ? user.claims.map((c) => `\`${c.id.slice(0, 8)}\` (${c.status})`).join(", ") : "aucun"}`,
    ];

    await interaction.editReply(lines.join("\n"));
  }
}
