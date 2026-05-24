import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const eventId = searchParams.get("eventId");

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (eventId) where.cart = { eventId };

  const claims = await prisma.claim.findMany({
    where,
    include: {
      user: { select: { username: true, discordId: true } },
      cart: {
        include: { event: { select: { name: true } } },
      },
      ticket: { select: { discordChannelId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["ID", "Date", "User", "DiscordID", "Cart", "Event", "Prix", "Quantité", "Statut", "Ticket"];
  const rows = claims.map((c) => [
    c.id,
    c.createdAt.toISOString(),
    c.user.username,
    c.user.discordId,
    c.cart.title,
    c.cart.event?.name ?? "",
    c.cart.price ?? "",
    c.cart.quantity,
    c.status,
    c.ticket?.discordChannelId ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="claims_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
