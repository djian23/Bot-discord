import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";

export const data = new SlashCommandBuilder()
  .setName("myclaims")
  .setDescription("Voir tes claims récents");

export async function execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
  await interaction.deferReply({ ephemeral: true });

  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
    include: {
      claims: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          cart: { include: { event: { select: { name: true } } } },
        },
      },
    },
  });

  if (!user || !user.claims.length) {
    return interaction.editReply("Tu n'as aucun claim pour l'instant.");
  }

  const statusEmoji: Record<string, string> = {
    PENDING: "⏳",
    PAID: "✅",
    CANCELLED: "❌",
    REFUNDED: "↩️",
  };

  const lines = user.claims.map((c) => {
    const emoji = statusEmoji[c.status] ?? "•";
    const price = c.cart.price ? ` — ${c.cart.price}€` : "";
    const event = c.cart.event?.name ? ` (${c.cart.event.name})` : "";
    const date = new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    return `${emoji} **${c.cart.title}**${event}${price} — ${date}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`🛒 Mes claims — ${interaction.user.username}`)
    .setColor(0x5865f2)
    .setDescription(lines.join("\n"))
    .addFields(
      { name: "Total", value: String(user.claimsCount), inline: true },
      { name: "Paid", value: String(user.paidCount), inline: true },
      { name: "Cancelled", value: String(user.cancelledCount), inline: true },
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setFooter({ text: `Max ${user.maxClaimsPerDay} claims/jour` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
