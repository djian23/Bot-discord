import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../../client";
import { generateWtsMessage, WtsEvent, WtsStyle } from "@discord-manager/shared";

export const data = new SlashCommandBuilder()
  .setName("wts")
  .setDescription("Génère un message WTS depuis les places du ticket")
  .addStringOption(o =>
    o.setName("style")
     .setDescription("Style du message")
     .addChoices(
       { name: "🔥 Hype", value: "HYPE" },
       { name: "🚨 Multi", value: "MULTI" },
       { name: "🎫 Minimal", value: "MINIMAL" },
       { name: "💎 Premium", value: "PREMIUM" },
     )
     .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
  await interaction.deferReply();

  const ticket = await prisma.ticket.findUnique({
    where: { discordChannelId: interaction.channelId },
    include: {
      claims: {
        where: { status: { in: ["PENDING", "PAID"] } },
        include: { cart: { include: { event: { select: { name: true } } } } },
      },
    },
  });

  if (!ticket) {
    return interaction.editReply("❌ Cette commande doit être utilisée dans un canal ticket.");
  }

  if (!ticket.claims.length) {
    return interaction.editReply("📭 Aucune place dans ce ticket.");
  }

  // Group claims by event name
  const byEvent = new Map<string, WtsEvent>();
  for (const claim of ticket.claims) {
    const eventName = claim.cart.event?.name ?? "Event inconnu";
    if (!byEvent.has(eventName)) {
      byEvent.set(eventName, { name: eventName, tickets: [] });
    }
    const ev = byEvent.get(eventName)!;
    const qty = claim.cart.quantity === 2 ? "DUO"
              : claim.cart.quantity === 1 ? "SINGLE"
              : `${claim.cart.quantity}X`;
    ev.tickets.push({
      category: claim.cart.category ?? claim.cart.section ?? "CAT",
      quantity: qty,
      // price left empty — staff fills manually
    });
  }

  const style = (interaction.options.getString("style") ?? "MULTI") as WtsStyle;
  const events = Array.from(byEvent.values());

  const message = generateWtsMessage(events, { style, instantTransfer: true, cta: "DM FAST" });

  await interaction.editReply({
    content: `📋 **Brouillon WTS généré** — complète les prix (\`___€ each\`) avant de copier :\n\n${message}`,
  });
}
