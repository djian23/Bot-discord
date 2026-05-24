import { ModalSubmitInteraction, TextChannel } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { buildPublicEmbed, EmbedTemplate } from "../services/cartService";

export async function handleModal(interaction: ModalSubmitInteraction, client: BotClient) {
  const [prefix, ...args] = interaction.customId.split(":");

  if (prefix === "modal_add_note") {
    await interaction.deferReply({ ephemeral: true });
    const cartId = args[0];
    const content = interaction.fields.getTextInputValue("note_content");

    const ticket = await prisma.ticket.findFirst({
      where: { discordChannelId: interaction.channelId!, status: "OPEN" },
    });
    const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });

    if (!user) return interaction.editReply("❌ Compte introuvable.");

    if (ticket) {
      await prisma.staffNote.create({
        data: { userId: ticket.userId, ticketId: ticket.id, authorId: user.id, content },
      });
      await prisma.ticketLog.create({
        data: { ticketId: ticket.id, authorId: user.id, content: `📝 Note staff : ${content}`, isStaff: true },
      });
      await interaction.channel?.send({
        content: `📝 **Note staff ajoutée par ${interaction.user.username}**\n${content}`,
      });
    }

    await interaction.editReply("✅ Note ajoutée.");
    return;
  }

  if (prefix === "modal_cart_edit") {
    await interaction.deferReply({ ephemeral: true });
    const cartId = args[0];

    const title = interaction.fields.getTextInputValue("title").trim();
    const priceRaw = interaction.fields.getTextInputValue("price").trim();
    const quantityRaw = interaction.fields.getTextInputValue("quantity").trim();
    const category = interaction.fields.getTextInputValue("category").trim() || null;
    const checkoutLink = interaction.fields.getTextInputValue("checkout_link").trim() || null;

    const price = priceRaw ? parseFloat(priceRaw.replace(",", ".")) : null;
    const quantity = parseInt(quantityRaw) || 1;

    const cart = await prisma.cart.update({
      where: { id: cartId },
      data: { title, price: isNaN(price as number) ? null : price, quantity, category, checkoutLink },
      include: { event: true },
    });

    // Update the already-posted public channel embed
    if (cart.event.publicChannelId && cart.publicMessageId) {
      try {
        const pubChannel = client.channels.cache.get(cart.event.publicChannelId) as TextChannel;
        const pubMsg = await pubChannel?.messages.fetch(cart.publicMessageId);
        if (pubMsg) {
          const tpl = (cart.event.embedTemplate ?? {}) as EmbedTemplate;
          const newEmbed = buildPublicEmbed(cart as any, tpl);
          await pubMsg.edit({ embeds: [newEmbed] });
        }
      } catch {}
    }

    await interaction.editReply(`✅ Cart mis à jour et embed public rafraîchi.`);
    return;
  }
}
