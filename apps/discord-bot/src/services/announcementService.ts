import OpenAI from "openai";
import { EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@discord-manager/database";
import { BotClient } from "../client";
import type { AnnouncementStyle } from "@discord-manager/database";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const STYLE_PROMPTS: Record<string, string> = {
  HYPE: "Style hype, énergique, avec emojis feu, éclairs et fusées. Très dynamique.",
  PRO: "Style professionnel et sérieux. Peu d'emojis. Ton formel.",
  LUXE: "Style luxueux et exclusif. Emojis diamant et couronne. Ton élégant.",
  MINIMAL: "Style minimaliste. Très peu d'emojis. Concis et épuré.",
};

export async function enhanceAnnouncementWithAI(
  rawContent: string,
  style: AnnouncementStyle = "HYPE",
): Promise<{ title: string; content: string; embedColor: string }> {
  const stylePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.HYPE;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Tu es un expert en communication pour serveurs Discord. Tu transformes des textes bruts en annonces Discord percutantes. ${stylePrompt}
Réponds UNIQUEMENT avec un JSON valide de cette forme :
{"title": "...", "content": "...", "embedColor": "#HEXCOLOR"}
- title : titre court et accrocheur
- content : annonce complète avec emojis, mise en forme markdown Discord (**gras**, *italique*), CTA
- embedColor : couleur hex adaptée au style`,
      },
      { role: "user", content: rawContent },
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  try {
    const text = completion.choices[0].message.content ?? "{}";
    return JSON.parse(text);
  } catch {
    return { title: "Annonce", content: rawContent, embedColor: "#5865F2" };
  }
}

export async function sendAnnouncement(
  client: BotClient,
  announcementId: string,
) {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!announcement || announcement.status !== "DRAFT") return;

  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
  if (!guild) return;

  const channel = guild.channels.cache.get(announcement.channelId) as TextChannel;
  if (!channel) return;

  const content = announcement.isAiEnhanced ? announcement.finalContent : announcement.rawContent;

  const embed = new EmbedBuilder()
    .setDescription(content ?? announcement.rawContent)
    .setColor(parseInt((announcement.embedColor ?? "#5865F2").replace("#", ""), 16))
    .setTimestamp();

  if (announcement.title) embed.setTitle(announcement.title);
  if (announcement.image) embed.setImage(announcement.image);

  let pingContent = "";
  if (announcement.pingType === "everyone") pingContent = "@everyone";
  else if (announcement.pingType === "here") pingContent = "@here";
  else if (announcement.pingType === "role" && announcement.pingTargetId) {
    pingContent = `<@&${announcement.pingTargetId}>`;
  }

  const msg = await channel.send({ content: pingContent || undefined, embeds: [embed] });

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { status: "SENT", sentAt: new Date(), messageId: msg.id },
  });
}
