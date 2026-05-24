import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { BotClient } from "../../client";
import { createEventWithChannels } from "../../services/eventService";
import { prisma } from "@discord-manager/database";

export const data = new SlashCommandBuilder()
  .setName("event")
  .setDescription("Gestion des events")
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Créer un nouvel event")
      .addStringOption((o) => o.setName("name").setDescription("Nom de l'event").setRequired(true))
      .addStringOption((o) => o.setName("site").setDescription("Site").setRequired(false))
      .addStringOption((o) => o.setName("pas").setDescription("PAS (ex: 30€ each)").setRequired(false))
      .addStringOption((o) => o.setName("color").setDescription("Couleur embed hex (ex: #FF0000)").setRequired(false))
      .addStringOption((o) =>
        o.setName("mode").setDescription("Mode").setRequired(false)
          .addChoices(
            { name: "Public", value: "PUBLIC" },
            { name: "VIP", value: "VIP" },
            { name: "Privé", value: "PRIVATE" },
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Lister les events actifs"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("toggle")
      .setDescription("Activer/désactiver un event")
      .addStringOption((o) => o.setName("id").setDescription("ID de l'event").setRequired(true)),
  );

export const adminOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const sub = interaction.options.getSubcommand();

  if (sub === "create") {
    await interaction.deferReply({ ephemeral: true });
    const name = interaction.options.getString("name", true);
    const site = interaction.options.getString("site") ?? undefined;
    const pas = interaction.options.getString("pas") ?? undefined;
    const color = interaction.options.getString("color") ?? "#5865F2";
    const mode = (interaction.options.getString("mode") ?? "PUBLIC") as "PUBLIC" | "VIP" | "PRIVATE";

    const { event, webhook } = await createEventWithChannels(interaction.guild!, {
      guildId: interaction.guildId!,
      name,
      site,
      pasText: pas,
      embedColor: color,
      mode,
    });

    await interaction.editReply(
      `✅ Event **${event.name}** créé !\n` +
      `• Source : <#${event.sourceChannelId}>\n` +
      `• Public : <#${event.publicChannelId}>\n` +
      `• Logs : <#${event.logsChannelId}>\n` +
      `• Webhook URL : \`${webhook.url}\``,
    );
    return;
  }

  if (sub === "list") {
    await interaction.deferReply({ ephemeral: true });
    const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
    if (!guild) return interaction.editReply("❌ Serveur non configuré.");

    const events = await prisma.event.findMany({
      where: { guildId: guild.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    if (!events.length) return interaction.editReply("Aucun event.");

    const lines = events.map((e) => `• **${e.name}** — ${e.status} — ${e.mode}`).join("\n");
    await interaction.editReply(`**Events :**\n${lines}`);
    return;
  }

  if (sub === "toggle") {
    await interaction.deferReply({ ephemeral: true });
    const id = interaction.options.getString("id", true);
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return interaction.editReply("❌ Event introuvable.");

    const newStatus = event.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await prisma.event.update({ where: { id }, data: { status: newStatus } });
    await interaction.editReply(`✅ Event **${event.name}** → **${newStatus}**`);
  }
}
