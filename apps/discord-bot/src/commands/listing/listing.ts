import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";

export const data = new SlashCommandBuilder()
  .setName("listing")
  .setDescription("Affiche le listing de tous les carts du ticket courant");

const STATUS_EMOJI: Record<string, string> = {
  PENDING: "⏳",
  PAID:    "✅",
  CANCELLED: "❌",
  REFUNDED: "↩️",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "En attente",
  PAID:      "Payé",
  CANCELLED: "Annulé",
  REFUNDED:  "Remboursé",
};

export async function execute(
  interaction: ChatInputCommandInteraction,
  _client: BotClient,
) {
  await interaction.deferReply();

  // Must be inside a ticket channel
  const ticket = await prisma.ticket.findUnique({
    where: { discordChannelId: interaction.channelId },
    include: {
      user: true,
      claims: {
        orderBy: { createdAt: "asc" },
        include: {
          cart: {
            include: {
              event: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    return interaction.editReply({
      content: "❌ Cette commande doit être utilisée dans un canal ticket.",
    });
  }

  if (ticket.claims.length === 0) {
    return interaction.editReply({
      content: "📭 Aucun cart dans ce ticket pour l'instant.",
    });
  }

  // Build listing lines — one per claim
  const lines: string[] = [];
  let totalPrix = 0;
  let totalBillets = 0;

  for (const [i, claim] of ticket.claims.entries()) {
    const cart = claim.cart;
    const emoji = STATUS_EMOJI[claim.status] ?? "•";
    const statusLabel = STATUS_LABEL[claim.status] ?? claim.status;
    const eventName = cart.event?.name ?? "—";
    const prix = cart.price != null ? `**${cart.price}€**` : "prix inconnu";
    const qty = `x${cart.quantity}`;
    const cat = cart.category ? ` · 🏷️ ${cart.category}` : "";
    const section = cart.section ? ` · ${cart.section}` : "";
    const date = new Date(claim.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

    if (cart.price) totalPrix += cart.price * cart.quantity;
    totalBillets += cart.quantity;

    lines.push(
      `**${i + 1}.** ${emoji} \`${eventName}\` — ${cart.title}` +
      `\n　💰 ${prix} · 🎟️ ${qty}${cat}${section} · 📅 ${date} · *${statusLabel}*`,
    );
  }

  // Stats summary
  const paidCount = ticket.claims.filter((c) => c.status === "PAID").length;
  const pendingCount = ticket.claims.filter((c) => c.status === "PENDING").length;
  const cancelledCount = ticket.claims.filter((c) => c.status === "CANCELLED").length;

  const embed = new EmbedBuilder()
    .setTitle(`📋 Listing — ${ticket.user.username}`)
    .setColor(0x5865f2)
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: "🎟️ Total billets", value: String(totalBillets), inline: true },
      { name: "💰 Total prix", value: totalPrix > 0 ? `${totalPrix.toFixed(2)}€` : "—", inline: true },
      { name: "📊 Statuts", value: `✅ ${paidCount} payé · ⏳ ${pendingCount} en attente · ❌ ${cancelledCount} annulé`, inline: false },
    )
    .setFooter({ text: `Ticket ouvert le ${new Date(ticket.createdAt).toLocaleDateString("fr-FR")}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
