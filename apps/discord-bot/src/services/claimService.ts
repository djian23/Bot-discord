import { ButtonInteraction, GuildMember } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { getOrCreateTicket } from "./ticketService";
import { buildClaimLog, sendLog } from "./logService";
import { emitWsEvent } from "../api/wsServer";

export async function processClaim(interaction: ButtonInteraction, client: BotClient, cartId: string) {
  await interaction.deferReply({ ephemeral: true });

  const member = interaction.member as GuildMember;
  const guildRecord = await prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
  if (!guildRecord) return interaction.editReply("❌ Serveur non configuré.");

  // Load cart
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { event: true } });
  if (!cart) return interaction.editReply("❌ Cart introuvable.");
  if (cart.status !== "AVAILABLE") return interaction.editReply("❌ Ce cart n'est plus disponible.");

  // Load or create user
  let user = await prisma.user.findUnique({ where: { discordId: member.id } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        discordId: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.avatar,
      },
    });
  }

  // Blacklist check
  if (user.isBlacklisted) {
    return interaction.editReply("❌ Tu es blacklisté et ne peux pas claim.");
  }

  // Role check
  if (cart.event.allowedRoleId && !member.roles.cache.has(cart.event.allowedRoleId)) {
    return interaction.editReply("❌ Tu n'as pas le rôle requis pour claim cet event.");
  }

  // Daily limit check
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayClaims = await prisma.claim.count({
    where: { userId: user.id, createdAt: { gte: todayStart } },
  });
  if (todayClaims >= user.maxClaimsPerDay) {
    return interaction.editReply(`❌ Limite de ${user.maxClaimsPerDay} claims/jour atteinte.`);
  }

  // Cooldown check
  if (guildRecord.claimCooldownSeconds > 0 && user.lastClaimAt) {
    const elapsed = (Date.now() - user.lastClaimAt.getTime()) / 1000;
    if (elapsed < guildRecord.claimCooldownSeconds) {
      const remaining = Math.ceil(guildRecord.claimCooldownSeconds - elapsed);
      return interaction.editReply(`⏳ Cooldown actif. Réessaie dans ${remaining}s.`);
    }
  }

  // Mark cart as claimed
  await prisma.cart.update({ where: { id: cartId }, data: { status: "CLAIMED", claimedById: user.id } });

  // Get or create ticket
  const { ticket, channel } = await getOrCreateTicket(client, member, cart);

  // Create claim record
  const claim = await prisma.claim.create({
    data: {
      cartId: cart.id,
      userId: user.id,
      ticketId: ticket.id,
      status: "PENDING",
    },
  });

  // Update user stats
  await prisma.user.update({
    where: { id: user.id },
    data: { claimsCount: { increment: 1 }, lastClaimAt: new Date() },
  });

  // Log
  await prisma.log.create({
    data: {
      guildId: guildRecord.id,
      action: "CART_CLAIMED",
      actorId: user.id,
      cartId: cart.id,
      ticketId: ticket.id,
      eventId: cart.event.id,
      message: `${member.user.username} a claim le cart ${cart.title}`,
    },
  });

  if (guildRecord.successLogsChannelId) {
    await sendLog(
      client,
      guildRecord.successLogsChannelId,
      buildClaimLog({
        username: member.user.username,
        userId: member.id,
        cartId: cart.id,
        ticketChannelId: channel.id,
        eventName: cart.event.name,
        pasText: cart.event.pasText ?? undefined,
        pasAmount: cart.event.pasAmount ?? undefined,
      }),
    );
  }

  emitWsEvent({ type: "cart:claimed", payload: { cartId, userId: user.id }, timestamp: new Date().toISOString() });

  await interaction.editReply(`✅ Cart claim ! Va dans ton ticket <#${channel.id}>`);
}
