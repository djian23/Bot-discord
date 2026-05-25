import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { emitWsEvent } from "../api/wsServer";

export const customId = "cart_wants_pay";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  const cartId = args[0];
  await interaction.deferUpdate();

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) return interaction.followUp({ content: "❌ Compte introuvable.", ephemeral: true });

  const claim = await prisma.claim.findFirst({
    where: { cartId, userId: user.id },
    include: { cart: { include: { event: true } } },
  });
  if (!claim) return interaction.followUp({ content: "❌ Claim introuvable.", ephemeral: true });

  // Update claim
  await prisma.claim.update({
    where: { id: claim.id },
    data: { userWantsToPay: true, userSelectedAt: new Date(), status: "SELECTED_FOR_PAYMENT" },
  });

  // Update the embed message to show selection
  try {
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x57f287)
      .addFields({ name: "💳 Statut", value: "✅ **Sélectionné pour paiement**", inline: true });

    // Disable the button
    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`cart_wants_pay:${cartId}`)
        .setLabel("✅ Sélectionné")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
    );

    await interaction.message.edit({ embeds: [embed], components: [disabledRow] });
  } catch {}

  emitWsEvent({ type: "cart:claimed", payload: { cartId, userId: user.id }, timestamp: new Date().toISOString() });
}
