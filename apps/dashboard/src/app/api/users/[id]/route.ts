import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, reason, note, maxClaimsPerDay } = body;

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guild = await prisma.guild.findUnique({ where: { discordId: process.env.DISCORD_GUILD_ID! } });

  if (action === "blacklist") {
    await prisma.user.update({ where: { id: params.id }, data: { isBlacklisted: true, blacklistReason: reason } });
    await prisma.log.create({
      data: { guildId: guild!.id, action: "USER_BLACKLISTED", targetId: params.id, message: `Blacklisté : ${reason}` },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "unblacklist") {
    await prisma.user.update({ where: { id: params.id }, data: { isBlacklisted: false, blacklistReason: null } });
    await prisma.log.create({
      data: { guildId: guild!.id, action: "USER_UNBLACKLISTED", targetId: params.id, message: "Unblacklisté" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "add_note" && note) {
    const actor = await prisma.user.findUnique({ where: { discordId: (session?.user as any)?.discordId } });
    await prisma.staffNote.create({ data: { userId: params.id, authorId: actor!.id, content: note } });
    return NextResponse.json({ ok: true });
  }

  if (action === "set_claims_limit" && maxClaimsPerDay) {
    await prisma.user.update({ where: { id: params.id }, data: { maxClaimsPerDay: parseInt(maxClaimsPerDay) } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
