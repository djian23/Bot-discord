import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";
import botApi from "@/lib/botApi";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!["BOSS", "ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { channelId, rawContent, isAiEnhanced, style, pingType } = body;

  if (!channelId || !rawContent) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const guild = await prisma.guild.findUnique({ where: { discordId: process.env.DISCORD_GUILD_ID! } });
  const user = await prisma.user.findUnique({ where: { discordId: (session?.user as any)?.discordId } });

  if (!guild || !user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const announcement = await prisma.announcement.create({
    data: {
      guildId: guild.id,
      channelId,
      rawContent,
      isAiEnhanced: Boolean(isAiEnhanced),
      style: isAiEnhanced ? style : null,
      pingType: pingType || null,
      createdById: user.id,
      status: "DRAFT",
    },
  });

  try {
    await botApi.post(`/announcements/${announcement.id}/send`);
  } catch {
    return NextResponse.json({ error: "Bot unreachable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, id: announcement.id });
}
