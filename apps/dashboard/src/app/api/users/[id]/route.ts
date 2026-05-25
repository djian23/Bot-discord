import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        claims: { orderBy: { createdAt: "desc" }, take: 20, include: { cart: { include: { event: { select: { name: true } } } } } },
        tickets: { orderBy: { createdAt: "desc" }, take: 10 },
        staffNotes: { orderBy: { createdAt: "desc" }, include: { author: { select: { username: true } } } },
        invitesSent: { orderBy: { createdAt: "desc" }, take: 20, include: { invitee: { select: { username: true } } } },
      },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[users/GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, reason, note, maxClaimsPerDay } = body;

    const [user, guild] = await Promise.all([
      prisma.user.findUnique({ where: { id: params.id } }),
      prisma.guild.findUnique({ where: { discordId: process.env.DISCORD_GUILD_ID! } }),
    ]);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!guild) return NextResponse.json({ error: "Guild not found" }, { status: 500 });

    if (action === "blacklist") {
      await Promise.all([
        prisma.user.update({ where: { id: params.id }, data: { isBlacklisted: true, blacklistReason: reason } }),
        prisma.log.create({ data: { guildId: guild.id, action: "USER_BLACKLISTED", targetId: params.id, message: `Blacklisté : ${reason}` } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (action === "unblacklist") {
      await Promise.all([
        prisma.user.update({ where: { id: params.id }, data: { isBlacklisted: false, blacklistReason: null } }),
        prisma.log.create({ data: { guildId: guild.id, action: "USER_UNBLACKLISTED", targetId: params.id, message: "Unblacklisté" } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_note" && note) {
      const actor = await prisma.user.findUnique({
        where: { discordId: (session?.user as any)?.discordId },
        select: { id: true },
      });
      await prisma.staffNote.create({ data: { userId: params.id, authorId: actor!.id, content: note } });
      return NextResponse.json({ ok: true });
    }

    if (action === "set_claims_limit" && maxClaimsPerDay) {
      await prisma.user.update({ where: { id: params.id }, data: { maxClaimsPerDay: parseInt(maxClaimsPerDay) } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[users/PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
