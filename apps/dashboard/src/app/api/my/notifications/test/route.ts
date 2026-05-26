import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@discord-manager/database";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { discordId: getSessionUser(session)?.discordId ?? "" },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const s = await prisma.notificationSettings.findUnique({ where: { userId: user.id } });
  if (!s?.pushoverUserKey) {
    return NextResponse.json({ error: "Pushover User Key non configuré" }, { status: 400 });
  }

  const guildSettings = await prisma.guildSettings.findFirst();
  if (!guildSettings?.pushoverAppToken) {
    return NextResponse.json({ error: "Pushover App Token non configuré par l'admin" }, { status: 400 });
  }

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: guildSettings.pushoverAppToken,
      user: s.pushoverUserKey,
      title: "🔔 Test Notification",
      message: "Pushover fonctionne correctement !",
      priority: 0,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Pushover error: ${text}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
