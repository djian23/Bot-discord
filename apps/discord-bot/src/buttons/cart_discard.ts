import { ButtonInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { hasPermission } from "../utils/permissions";
import { EMBED_COLORS } from "@discord-manager/shared";

export const customId = "cart_discard";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  if (!hasPermission(interaction.member as any, "STAFF")) {
    return interaction.reply({ content: "❌ Réservé au staff.", ephemeral: true });
  }

  const cartId = args[0];
  if (!cartId) return interaction.reply({ content: "❌ Cart ID manquant.", ephemeral: true });

  await interaction.deferUpdate();

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { event: true },
  });

  if (!cart || !["AVAILABLE", "DRAFT"].includes(cart.status)) {
    return interaction.followUp({ content: "❌ Cart introuvable ou déjà traité.", ephemeral: true });
  }

  await prisma.cart.update({ where: { id: cartId }, data: { status: "CANCELLED" } });

  // Remove from public channel if already posted
  if (cart.event.publicChannelId && cart.publicMessageId) {
    try {
      const pubChannel = client.channels.cache.get(cart.event.publicChannelId) as TextChannel;
      const pubMsg = await pubChannel?.messages.fetch(cart.publicMessageId);
      if (pubMsg) {
        const embed = EmbedBuilder.from(pubMsg.embeds[0])
          .setColor(EMBED_COLORS.ERROR)
          .setTitle("❌ Cart Annulé");
        await pubMsg.edit({ embeds: [embed], components: [] });
      }
    } catch {}
  }

  // Remove buttons from source control panel
  await interaction.message.edit({ components: [] }).catch(() => {});
}
