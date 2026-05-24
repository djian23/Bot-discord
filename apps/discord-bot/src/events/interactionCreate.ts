import { Events, Interaction } from "discord.js";
import { BotClient } from "../client";
import { hasPermission } from "../utils/permissions";
import { handleModal } from "../handlers/modalHandler";

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction, client: BotClient) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (command.bossOnly && !hasPermission(interaction.member, "BOSS")) {
      await interaction.reply({ content: "❌ Accès réservé au Boss.", ephemeral: true });
      return;
    }
    if (command.adminOnly && !hasPermission(interaction.member, "ADMIN")) {
      await interaction.reply({ content: "❌ Accès réservé aux admins.", ephemeral: true });
      return;
    }
    if (command.staffOnly && !hasPermission(interaction.member, "STAFF")) {
      await interaction.reply({ content: "❌ Accès réservé au staff.", ephemeral: true });
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[Command] Error in ${interaction.commandName}:`, err);
      const msg = { content: "❌ Une erreur est survenue.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const [prefix, ...rest] = interaction.customId.split(":");
    const handler = client.buttons.get(prefix);
    if (!handler) return;

    try {
      await handler.execute(interaction, client, rest);
    } catch (err) {
      console.error(`[Button] Error in ${prefix}:`, err);
      await interaction.reply({ content: "❌ Une erreur est survenue.", ephemeral: true });
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    try {
      await handleModal(interaction, client);
    } catch (err) {
      console.error("[Modal] Error:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Une erreur est survenue.", ephemeral: true });
      }
    }
    return;
  }
}
