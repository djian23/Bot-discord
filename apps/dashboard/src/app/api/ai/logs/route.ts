import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes(getSessionUser(session)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const guild = await prisma.guild.findUnique({
    where: { discordId: process.env.DISCORD_GUILD_ID! },
    include: { aiSettings: true },
  });

  if (!guild?.aiSettings) {
    return NextResponse.json({ logs: [] });
  }

  const logs = await prisma.aiLog.findMany({
    where: { aiSettingsId: guild.aiSettings.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ logs });
}
