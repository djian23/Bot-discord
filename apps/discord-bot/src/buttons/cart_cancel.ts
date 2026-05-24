import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { emitWsEvent } from "../api/wsServer";

export const customId = "cart_cancel";

export async function execute(interaction: ButtonInteraction, _client: BotClient, args: string[]) {
  await interaction.deferReply({ ephemeral: true });
  const cartId = args[0];

  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) return interaction.editReply("❌ Cart introuvable.");
  if (!["CLAIMED", "AVAILABLE"].includes(cart.status)) {
    return interaction.editReply("❌ Ce cart ne peut pas être annulé.");
  }

  await prisma.cart.update({ where: { id: cartId }, data: { status: "CANCELLED" } });
  await prisma.claim.updateMany({ where: { cartId, status: "PENDING" }, data: { status: "CANCELLED" } });

  const user = await prisma.user.findFirst({ where: { discordId: interaction.user.id } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { cancelledCount: { increment: 1 } },
    });
  }

  const guild = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
  await prisma.log.create({
    data: {
      guildId: guild!.id,
      action: "CART_CANCELLED",
      cartId,
      actorId: user?.id,
      message: `Cart annulé par ${interaction.user.username}`,
    },
  });

  emitWsEvent({ type: "cart:cancelled", payload: { cartId }, timestamp: new Date().toISOString() });
  await interaction.editReply("✅ Cart annulé.");
}
