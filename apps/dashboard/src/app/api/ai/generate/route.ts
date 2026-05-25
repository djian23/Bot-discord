import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";
import {
  generateWTS,
  rewriteMessage,
  generateEmbed,
  generateAnnouncement,
  parseWTS,
  AiSettingsConfig,
} from "@/lib/openrouter";

type GenerateType = "WTS" | "REWRITE" | "EMBED" | "ANNOUNCEMENT" | "PARSE";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!["BOSS", "ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { type: GenerateType; input: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, input } = body;

  if (!type || !input?.trim()) {
    return NextResponse.json({ error: "Missing type or input" }, { status: 400 });
  }

  const guild = await prisma.guild.findUnique({
    where: { discordId: process.env.DISCORD_GUILD_ID! },
    include: { aiSettings: true },
  });

  if (!guild?.aiSettings) {
    return NextResponse.json({ error: "AI settings not configured" }, { status: 400 });
  }

  const aiSettings = guild.aiSettings;

  if (!aiSettings.enabled) {
    return NextResponse.json({ error: "AI is not enabled" }, { status: 400 });
  }

  if (!aiSettings.openrouterApiKey) {
    return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 400 });
  }

  const config: AiSettingsConfig = {
    id: aiSettings.id,
    guildId: aiSettings.guildId,
    enabled: aiSettings.enabled,
    openrouterApiKey: aiSettings.openrouterApiKey,
    mainModel: aiSettings.mainModel,
    fallbackModel: aiSettings.fallbackModel,
    temperature: aiSettings.temperature,
    maxTokens: aiSettings.maxTokens,
    timeoutSeconds: aiSettings.timeoutSeconds,
    enableFallback: aiSettings.enableFallback,
    enableLogs: aiSettings.enableLogs,
  };

  try {
    let result: string | object;

    switch (type) {
      case "WTS":
        result = await generateWTS(input, config);
        break;
      case "REWRITE":
        result = await rewriteMessage(input, config);
        break;
      case "EMBED":
        result = await generateEmbed(input, config);
        break;
      case "ANNOUNCEMENT":
        result = await generateAnnouncement(input, config);
        break;
      case "PARSE":
        result = await parseWTS(input, config);
        break;
      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
