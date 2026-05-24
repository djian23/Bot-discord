import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await prisma.dailyStats.findMany({
    orderBy: { date: "desc" },
    take: 90,
  });

  const headers = ["Date", "Carts Reçus", "Carts Claim", "Carts Paid", "Carts Expirés", "Carts Annulés", "Tickets Ouverts", "Tickets Fermés", "Nouveaux Users"];
  const rows = stats.map((s) => [
    s.date.toISOString().slice(0, 10),
    s.cartsReceived,
    s.cartsClaimed,
    s.cartsPaid,
    s.cartsExpired,
    s.cartsCancelled,
    s.ticketsOpened,
    s.ticketsClosed,
    s.newUsers,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
