import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";

export const data = new SlashCommandBuilder()
  .setName("role")
  .setDescription("Gestion des panels de rôles")
  .addSubcommand((sub) =>
    sub
      .setName("panel")
      .setDescription("Créer un panel de rôles")
      .addStringOption((o) => o.setName("name").setDescription("Nom du panel").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Salon").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Ajouter un rôle à un panel")
      .addStringOption((o) => o.setName("panel_id").setDescription("ID du panel").setRequired(true))
      .addRoleOption((o) => o.setName("role").setDescription("Rôle").setRequired(true))
      .addStringOption((o) => o.setName("label").setDescription("Label du bouton").setRequired(true))
      .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(false))
      .addIntegerOption((o) => o.setName("min_claims").setDescription("Claims minimum").setRequired(false))
      .addIntegerOption((o) => o.setName("min_invites").setDescription("Invites minimum").setRequired(false)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("publish")
      .setDescription("Publier un panel de rôles dans son salon")
      .addStringOption((o) => o.setName("panel_id").setDescription("ID du panel").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Lister les panels"),
  );

export const adminOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const sub = interaction.options.getSubcommand();

  if (sub === "panel") {
    await interaction.deferReply({ ephemeral: true });
    const name = interaction.options.getString("name", true);
    const channel = interaction.options.getChannel("channel", true);
    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });

    const panel = await prisma.rolePanel.create({
      data: {
        guildId: guild!.id,
        name,
        channelId: channel.id,
        type: "BUTTON",
        isActive: true,
      },
    });

    await interaction.editReply(`✅ Panel **${name}** créé. ID : \`${panel.id}\``);
    return;
  }

  if (sub === "add") {
    await interaction.deferReply({ ephemeral: true });
    const panelId = interaction.options.getString("panel_id", true);
    const role = interaction.options.getRole("role", true);
    const label = interaction.options.getString("label", true);
    const emoji = interaction.options.getString("emoji") ?? undefined;
    const minClaims = interaction.options.getInteger("min_claims") ?? undefined;
    const minInvites = interaction.options.getInteger("min_invites") ?? undefined;

    const panel = await prisma.rolePanel.findUnique({ where: { id: panelId } });
    if (!panel) return interaction.editReply("❌ Panel introuvable.");

    await prisma.roleOption.create({
      data: {
        panelId,
        roleId: role.id,
        label,
        emoji,
        minClaims,
        minInvites,
      },
    });

    await interaction.editReply(`✅ Rôle **${role.name}** ajouté au panel \`${panelId}\`.`);
    return;
  }

  if (sub === "publish") {
    await interaction.deferReply({ ephemeral: true });
    const panelId = interaction.options.getString("panel_id", true);

    const panel = await prisma.rolePanel.findUnique({
      where: { id: panelId },
      include: { options: true },
    });
    if (!panel) return interaction.editReply("❌ Panel introuvable.");
    if (!panel.options.length) return interaction.editReply("❌ Aucun rôle dans ce panel.");

    const embed = new EmbedBuilder()
      .setTitle(`🎭 ${panel.name}`)
      .setDescription("Clique sur un bouton pour obtenir ou retirer un rôle.")
      .setColor(0x5865f2);

    for (const opt of panel.options) {
      const parts = [`Rôle : <@&${opt.roleId}>`];
      if (opt.minClaims) parts.push(`Min claims : ${opt.minClaims}`);
      if (opt.minInvites) parts.push(`Min invites : ${opt.minInvites}`);
      if (opt.manualOnly) parts.push("Attribution manuelle");
      embed.addFields({ name: (opt.emoji ? opt.emoji + " " : "") + opt.label, value: parts.join(" | "), inline: true });
    }

    // Max 5 buttons per row
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < panel.options.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      const chunk = panel.options.slice(i, i + 5);
      for (const opt of chunk) {
        const btn = new ButtonBuilder()
          .setCustomId(`role_toggle:${opt.id}`)
          .setLabel(opt.label)
          .setStyle(ButtonStyle.Secondary);
        if (opt.emoji) btn.setEmoji(opt.emoji);
        row.addComponents(btn);
      }
      rows.push(row);
    }

    const channel = client.channels.cache.get(panel.channelId) as TextChannel;
    if (!channel) return interaction.editReply("❌ Salon introuvable.");

    const msg = await channel.send({ embeds: [embed], components: rows });
    await prisma.rolePanel.update({ where: { id: panelId }, data: { messageId: msg.id } });

    await interaction.editReply(`✅ Panel **${panel.name}** publié dans <#${panel.channelId}> !`);
    return;
  }

  if (sub === "list") {
    await interaction.deferReply({ ephemeral: true });
    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
    const panels = await prisma.rolePanel.findMany({
      where: { guildId: guild!.id },
      include: { _count: { select: { options: true } } },
    });

    if (!panels.length) return interaction.editReply("Aucun panel.");
    const lines = panels.map((p) => `• \`${p.id}\` **${p.name}** — ${p._count.options} rôles — ${p.isActive ? "actif" : "inactif"}`);
    await interaction.editReply(`**Panels :**\n${lines.join("\n")}`);
  }
}
