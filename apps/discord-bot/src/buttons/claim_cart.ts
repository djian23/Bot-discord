import { ButtonInteraction } from "discord.js";
import { BotClient } from "../client";
import { processClaim } from "../services/claimService";

export const customId = "claim_cart";

export async function execute(interaction: ButtonInteraction, client: BotClient, args: string[]) {
  const cartId = args[0];
  if (!cartId) return interaction.reply({ content: "❌ Cart ID manquant.", ephemeral: true });
  await processClaim(interaction, client, cartId);
}
