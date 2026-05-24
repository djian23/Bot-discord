import { EmbedBuilder, TextChannel } from "discord.js";
import { BotClient } from "../client";
import { EMBED_COLORS } from "@discord-manager/shared";

export async function sendLog(
  client: BotClient,
  channelId: string,
  embed: EmbedBuilder,
) {
  try {
    const channel = client.channels.cache.get(channelId) as TextChannel;
    if (!channel) return;
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("[LogService] Failed to send log:", err);
  }
}

export function buildClaimLog(data: {
  username: string;
  userId: string;
  cartId: string;
  ticketChannelId: string;
  eventName: string;
  pasText?: string;
  pasAmount?: number;
}) {
  return new EmbedBuilder()
    .setTitle("✅ Cart Claimed")
    .setColor(EMBED_COLORS.SUCCESS)
    .addFields(
      { name: "User", value: `<@${data.userId}>`, inline: true },
      { name: "Cart ID", value: `#${data.cartId.slice(0, 8)}`, inline: true },
      { name: "Ticket", value: `<#${data.ticketChannelId}>`, inline: true },
      { name: "Event", value: data.eventName, inline: true },
      { name: "PAS", value: data.pasText ?? (data.pasAmount ? `${data.pasAmount}€ each` : "—"), inline: true },
    )
    .setTimestamp();
}
