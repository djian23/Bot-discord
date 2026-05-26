import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

async function getGuild() {
  return prisma.guild.findUnique({
    where: { discordId: process.env.DISCORD_GUILD_ID! },
    include: { aiSettings: true },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes(getSessionUser(session)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const guild = await getGuild();
  if (!guild) {
    return NextResponse.json({ aiSettings: null });
  }

  return NextResponse.json({ aiSettings: guild.aiSettings ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes(getSessionUser(session)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const guild = await prisma.guild.findUnique({
    where: { discordId: process.env.DISCORD_GUILD_ID! },
  });

  if (!guild) {
    return NextResponse.json({ error: "Guild not found" }, { status: 404 });
  }

  const data = {
    enabled: Boolean(body.enabled),
    openrouterApiKey: body.openrouterApiKey?.trim() || null,
    mainModel: body.mainModel || "deepseek/deepseek-v4-flash:free",
    fallbackModel: body.fallbackModel || "qwen/qwen3-coder:free",
    temperature: parseFloat(body.temperature) || 0.7,
    maxTokens: parseInt(body.maxTokens) || 1024,
    timeoutSeconds: parseInt(body.timeoutSeconds) || 30,
    enableFallback: Boolean(body.enableFallback),
    enableLogs: Boolean(body.enableLogs),
  };

  const aiSettings = await prisma.aiSettings.upsert({
    where: { guildId: guild.id },
    update: data,
    create: { guildId: guild.id, ...data },
  });

  return NextResponse.json({ ok: true, aiSettings });
}
