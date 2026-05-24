import { ButtonInteraction } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { emitWsEvent } from "../api/wsServer";

export const customId = "cart_paid";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  await interaction.deferReply({ ephemeral: true });
  const cartId = args[0];

  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) return interaction.editReply("❌ Cart introuvable.");

  await prisma.cart.update({ where: { id: cartId }, data: { status: "PAID" } });
  await prisma.claim.updateMany({ where: { cartId }, data: { status: "PAID", paidAt: new Date() } });

  const user = await prisma.user.findFirst({ where: { discordId: interaction.user.id } });
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { paidCount: { increment: 1 } } });
  }

  await prisma.log.create({
    data: {
      guildId: process.env.DISCORD_GUILD_ID!,
      action: "CART_PAID",
      cartId,
      actorId: user?.id,
      message: `Cart marqué comme payé par ${interaction.user.username}`,
    },
  });

  emitWsEvent({ type: "cart:paid", payload: { cartId }, timestamp: new Date().toISOString() });
  await interaction.editReply("✅ Cart marqué comme payé !");
}
