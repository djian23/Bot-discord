import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";
import { enhanceAnnouncementWithAI, sendAnnouncement } from "../../services/announcementService";
import type { AnnouncementStyle } from "@discord-manager/database";

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Créer une annonce")
  .addStringOption((o) => o.setName("content").setDescription("Contenu de l'annonce").setRequired(true))
  .addChannelOption((o) => o.setName("channel").setDescription("Salon cible").setRequired(true))
  .addBooleanOption((o) => o.setName("ai").setDescription("Améliorer avec l'IA").setRequired(false))
  .addStringOption((o) =>
    o.setName("style").setDescription("Style IA").setRequired(false)
      .addChoices(
        { name: "Hype", value: "HYPE" },
        { name: "Pro", value: "PRO" },
        { name: "Luxe", value: "LUXE" },
        { name: "Minimal", value: "MINIMAL" },
      ),
  )
  .addStringOption((o) =>
    o.setName("ping").setDescription("Ping").setRequired(false)
      .addChoices(
        { name: "@everyone", value: "everyone" },
        { name: "@here", value: "here" },
        { name: "Aucun", value: "none" },
      ),
  );

export const staffOnly = true;

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  await interaction.deferReply({ ephemeral: true });

  const rawContent = interaction.options.getString("content", true);
  const channel = interaction.options.getChannel("channel", true);
  const useAi = interaction.options.getBoolean("ai") ?? false;
  const style = (interaction.options.getString("style") ?? "HYPE") as AnnouncementStyle;
  const ping = interaction.options.getString("ping") ?? "none";

  const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });

  let finalContent = rawContent;
  let title: string | undefined;
  let embedColor: string | undefined;

  if (useAi) {
    await interaction.editReply("🤖 Amélioration IA en cours...");
    const enhanced = await enhanceAnnouncementWithAI(rawContent, style);
    finalContent = enhanced.content;
    title = enhanced.title;
    embedColor = enhanced.embedColor;
  }

  const announcement = await prisma.announcement.create({
    data: {
      guildId: guild!.id,
      channelId: channel.id,
      rawContent,
      finalContent: useAi ? finalContent : null,
      title,
      embedColor,
      isAiEnhanced: useAi,
      style: useAi ? style : null,
      pingType: ping !== "none" ? ping : null,
      createdById: user!.id,
      status: "DRAFT",
    },
  });

  await sendAnnouncement(client, announcement.id);
  await interaction.editReply("✅ Annonce envoyée !");
}
