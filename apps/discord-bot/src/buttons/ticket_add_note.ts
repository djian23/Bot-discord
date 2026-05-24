import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { BotClient } from "../client";

export const customId = "ticket_add_note";

export async function execute(interaction: ButtonInteraction, _client: BotClient, args: string[]) {
  const cartId = args[0];

  const modal = new ModalBuilder()
    .setCustomId(`modal_add_note:${cartId}`)
    .setTitle("Ajouter une note staff");

  const noteInput = new TextInputBuilder()
    .setCustomId("note_content")
    .setLabel("Note")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Votre note…")
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
  await interaction.showModal(modal);
}
