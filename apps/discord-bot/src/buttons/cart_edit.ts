import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import { hasPermission } from "../utils/permissions";

export const customId = "cart_edit";

export async function execute(interaction: ButtonInteraction, _client: BotClient, args: string[]) {
  if (!hasPermission(interaction.member as any, "STAFF")) {
    return interaction.reply({ content: "❌ Réservé au staff.", ephemeral: true });
  }

  const cartId = args[0];
  if (!cartId) return interaction.reply({ content: "❌ Cart ID manquant.", ephemeral: true });

  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart || cart.status !== "DRAFT") {
    return interaction.reply({ content: "❌ Cart introuvable ou déjà traité.", ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId(`modal_cart_edit:${cartId}`)
    .setTitle("Modifier le cart");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Titre du cart")
        .setStyle(TextInputStyle.Short)
        .setValue(cart.title)
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("price")
        .setLabel("Prix (ex: 45.50)")
        .setStyle(TextInputStyle.Short)
        .setValue(cart.price != null ? String(cart.price) : "")
        .setRequired(false),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("quantity")
        .setLabel("Quantité")
        .setStyle(TextInputStyle.Short)
        .setValue(String(cart.quantity))
        .setRequired(true),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("category")
        .setLabel("Catégorie (ex: Fosse, Tribune, Pelouse)")
        .setStyle(TextInputStyle.Short)
        .setValue(cart.category ?? "")
        .setRequired(false),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("checkout_link")
        .setLabel("Lien checkout (optionnel)")
        .setStyle(TextInputStyle.Short)
        .setValue(cart.checkoutLink ?? "")
        .setRequired(false),
    ),
  );

  await interaction.showModal(modal);
}
