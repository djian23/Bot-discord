import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes(getSessionUser(session)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? undefined;
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;

  const logs = await prisma.log.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(from ? { createdAt: { gte: from } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { actor: { select: { username: true } }, target: { select: { username: true } } },
  });

  const headers = ["id", "action", "actor", "target", "message", "cartId", "ticketId", "eventId", "createdAt"];
  const rows = logs.map((l) => [
    l.id,
    l.action,
    l.actor?.username ?? "",
    l.target?.username ?? "",
    `"${(l.message ?? "").replace(/"/g, '""')}"`,
    l.cartId ?? "",
    l.ticketId ?? "",
    l.eventId ?? "",
    new Date(l.createdAt).toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="logs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
