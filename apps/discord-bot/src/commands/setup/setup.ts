import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ChannelType,
} from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Configurer le bot pour ce serveur")
  .addSubcommand((sub) =>
    sub
      .setName("roles")
      .setDescription("Configurer les rôles de permission")
      .addRoleOption((o) => o.setName("boss").setDescription("Rôle Boss").setRequired(false))
      .addRoleOption((o) => o.setName("admin").setDescription("Rôle Admin").setRequired(false))
      .addRoleOption((o) => o.setName("staff").setDescription("Rôle Staff").setRequired(false))
      .addRoleOption((o) => o.setName("vip").setDescription("Rôle VIP").setRequired(false)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("channels")
      .setDescription("Configurer les salons de logs")
      .addChannelOption((o) =>
        o.setName("success_logs").setDescription("Salon logs succès (paiements)").addChannelTypes(ChannelType.GuildText).setRequired(false),
      )
      .addChannelOption((o) =>
        o.setName("error_logs").setDescription("Salon logs erreurs").addChannelTypes(ChannelType.GuildText).setRequired(false),
      )
      .addChannelOption((o) =>
        o.setName("staff_logs").setDescription("Salon logs staff").addChannelTypes(ChannelType.GuildText).setRequired(false),
      )
      .addChannelOption((o) =>
        o.setName("ticket_category").setDescription("Catégorie pour les tickets").addChannelTypes(ChannelType.GuildCategory).setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("limits")
      .setDescription("Configurer les limites de claims")
      .addIntegerOption((o) =>
        o.setName("claims_per_day").setDescription("Claims max par jour (défaut: 5)").setMinValue(1).setMaxValue(50).setRequired(false),
      )
      .addIntegerOption((o) =>
        o.setName("cooldown").setDescription("Cooldown entre claims (secondes)").setMinValue(0).setMaxValue(3600).setRequired(false),
      )
      .addIntegerOption((o) =>
        o.setName("ticket_autoclose").setDescription("Auto-fermeture tickets (heures, défaut: 48)").setMinValue(1).setMaxValue(168).setRequired(false),
      )
      .addBooleanOption((o) =>
        o.setName("block_new_accounts").setDescription("Bloquer les nouveaux comptes Discord").setRequired(false),
      )
      .addIntegerOption((o) =>
        o.setName("min_account_age").setDescription("Âge minimum du compte Discord (jours)").setMinValue(0).setMaxValue(365).setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("info").setDescription("Voir la configuration actuelle du serveur"),
  );

export const bossOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
  await interaction.deferReply({ ephemeral: true });

  const guild = await prisma.guild.upsert({
    where: { discordId: interaction.guildId! },
    create: {
      discordId: interaction.guildId!,
      name: interaction.guild!.name,
      icon: interaction.guild!.icon ?? undefined,
    },
    update: {},
    include: { settings: true },
  });

  const sub = interaction.options.getSubcommand();

  if (sub === "roles") {
    const boss = interaction.options.getRole("boss");
    const admin = interaction.options.getRole("admin");
    const staff = interaction.options.getRole("staff");
    const vip = interaction.options.getRole("vip");

    if (!boss && !admin && !staff && !vip) {
      return interaction.editReply("❌ Spécifie au moins un rôle à configurer.");
    }

    const update: Record<string, string> = {};
    if (boss) update.bossRoleId = boss.id;
    if (admin) update.adminRoleId = admin.id;
    if (staff) update.staffRoleId = staff.id;
    if (vip) update.vipRoleId = vip.id;

    await prisma.guild.update({ where: { id: guild.id }, data: update });

    const lines = [];
    if (boss) lines.push(`👑 Boss → ${boss}`);
    if (admin) lines.push(`🛡️ Admin → ${admin}`);
    if (staff) lines.push(`⚙️ Staff → ${staff}`);
    if (vip) lines.push(`⭐ VIP → ${vip}`);

    return interaction.editReply(`✅ Rôles mis à jour :\n${lines.join("\n")}`);
  }

  if (sub === "channels") {
    const successLogs = interaction.options.getChannel("success_logs");
    const errorLogs = interaction.options.getChannel("error_logs");
    const staffLogs = interaction.options.getChannel("staff_logs");
    const ticketCategory = interaction.options.getChannel("ticket_category");

    if (!successLogs && !errorLogs && !staffLogs && !ticketCategory) {
      return interaction.editReply("❌ Spécifie au moins un salon à configurer.");
    }

    const guildUpdate: Record<string, string> = {};
    if (successLogs) guildUpdate.successLogsChannelId = successLogs.id;
    if (errorLogs) guildUpdate.errorLogsChannelId = errorLogs.id;
    if (staffLogs) guildUpdate.staffLogsChannelId = staffLogs.id;

    if (Object.keys(guildUpdate).length) {
      await prisma.guild.update({ where: { id: guild.id }, data: guildUpdate });
    }

    if (ticketCategory) {
      await prisma.guildSettings.upsert({
        where: { guildId: guild.id },
        create: { guildId: guild.id, ticketCategoryId: ticketCategory.id },
        update: { ticketCategoryId: ticketCategory.id },
      });
    }

    const lines = [];
    if (successLogs) lines.push(`✅ Logs succès → ${successLogs}`);
    if (errorLogs) lines.push(`❌ Logs erreurs → ${errorLogs}`);
    if (staffLogs) lines.push(`📋 Logs staff → ${staffLogs}`);
    if (ticketCategory) lines.push(`🎫 Catégorie tickets → ${ticketCategory}`);

    return interaction.editReply(`✅ Salons mis à jour :\n${lines.join("\n")}`);
  }

  if (sub === "limits") {
    const claimsPerDay = interaction.options.getInteger("claims_per_day");
    const cooldown = interaction.options.getInteger("cooldown");
    const ticketAutoClose = interaction.options.getInteger("ticket_autoclose");
    const blockNew = interaction.options.getBoolean("block_new_accounts");
    const minAge = interaction.options.getInteger("min_account_age");

    const guildUpdate: Record<string, number | boolean> = {};
    if (claimsPerDay !== null) guildUpdate.defaultClaimsPerDay = claimsPerDay;
    if (cooldown !== null) guildUpdate.claimCooldownSeconds = cooldown;
    if (blockNew !== null) guildUpdate.blockNewAccounts = blockNew;
    if (minAge !== null) guildUpdate.minAccountAgeDays = minAge;

    if (Object.keys(guildUpdate).length) {
      await prisma.guild.update({ where: { id: guild.id }, data: guildUpdate });
    }

    if (ticketAutoClose !== null) {
      await prisma.guildSettings.upsert({
        where: { guildId: guild.id },
        create: { guildId: guild.id, ticketAutoCloseHours: ticketAutoClose },
        update: { ticketAutoCloseHours: ticketAutoClose },
      });
    }

    const lines = [];
    if (claimsPerDay !== null) lines.push(`📦 Claims/jour → **${claimsPerDay}**`);
    if (cooldown !== null) lines.push(`⏱️ Cooldown → **${cooldown}s**`);
    if (ticketAutoClose !== null) lines.push(`🎫 Auto-close tickets → **${ticketAutoClose}h**`);
    if (blockNew !== null) lines.push(`🔒 Bloquer nouveaux comptes → **${blockNew ? "Oui" : "Non"}**`);
    if (minAge !== null) lines.push(`📅 Âge min compte → **${minAge} jours**`);

    return interaction.editReply(`✅ Limites mises à jour :\n${lines.join("\n")}`);
  }

  if (sub === "info") {
    const updated = await prisma.guild.findUnique({
      where: { id: guild.id },
      include: { settings: true },
    });

    if (!updated) return interaction.editReply("❌ Serveur non trouvé.");

    const embed = new EmbedBuilder()
      .setTitle(`⚙️ Configuration — ${interaction.guild!.name}`)
      .setColor(0x5865f2)
      .addFields(
        {
          name: "Rôles",
          value: [
            `👑 Boss: ${updated.bossRoleId ? `<@&${updated.bossRoleId}>` : "Non défini"}`,
            `🛡️ Admin: ${updated.adminRoleId ? `<@&${updated.adminRoleId}>` : "Non défini"}`,
            `⚙️ Staff: ${updated.staffRoleId ? `<@&${updated.staffRoleId}>` : "Non défini"}`,
            `⭐ VIP: ${updated.vipRoleId ? `<@&${updated.vipRoleId}>` : "Non défini"}`,
          ].join("\n"),
          inline: false,
        },
        {
          name: "Salons de logs",
          value: [
            `✅ Succès: ${updated.successLogsChannelId ? `<#${updated.successLogsChannelId}>` : "Non défini"}`,
            `❌ Erreurs: ${updated.errorLogsChannelId ? `<#${updated.errorLogsChannelId}>` : "Non défini"}`,
            `📋 Staff: ${updated.staffLogsChannelId ? `<#${updated.staffLogsChannelId}>` : "Non défini"}`,
          ].join("\n"),
          inline: false,
        },
        {
          name: "Limites",
          value: [
            `📦 Claims/jour: **${updated.defaultClaimsPerDay}**`,
            `⏱️ Cooldown: **${updated.claimCooldownSeconds}s**`,
            `🎫 Auto-close: **${updated.settings?.ticketAutoCloseHours ?? 48}h**`,
            `🔒 Bloquer nouveaux: **${updated.blockNewAccounts ? "Oui" : "Non"}**`,
            `📅 Âge min: **${updated.minAccountAgeDays} jours**`,
          ].join("\n"),
          inline: false,
        },
      )
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
}
