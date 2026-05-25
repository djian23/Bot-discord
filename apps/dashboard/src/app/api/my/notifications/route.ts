import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { discordId: (session.user as any)?.discordId ?? "" },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  // Whitelist allowed fields
  const {
    pushoverUserKey,
    pushoverAppToken,
    enabled,
    notifyPublicCarts,
    notifyTicketCarts,
    notifyClaims,
    notifyPaid,
    notifyExpired,
    quietHoursStart,
    quietHoursEnd,
  } = body;

  const data: Record<string, unknown> = {};
  if (pushoverUserKey !== undefined) data.pushoverUserKey = pushoverUserKey || null;
  if (pushoverAppToken !== undefined) data.pushoverAppToken = pushoverAppToken || null;
  if (enabled !== undefined) data.enabled = enabled;
  if (notifyPublicCarts !== undefined) data.notifyPublicCarts = notifyPublicCarts;
  if (notifyTicketCarts !== undefined) data.notifyTicketCarts = notifyTicketCarts;
  if (notifyClaims !== undefined) data.notifyClaims = notifyClaims;
  if (notifyPaid !== undefined) data.notifyPaid = notifyPaid;
  if (notifyExpired !== undefined) data.notifyExpired = notifyExpired;
  if (quietHoursStart !== undefined) data.quietHoursStart = quietHoursStart;
  if (quietHoursEnd !== undefined) data.quietHoursEnd = quietHoursEnd;

  await prisma.notificationSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
