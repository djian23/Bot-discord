import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json();

  if (action === "close") {
    await prisma.interestCheck.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reopen") {
    await prisma.interestCheck.update({
      where: { id: params.id },
      data: { isActive: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await prisma.interestCheck.findUnique({
    where: { id: params.id },
    include: {
      buttons: {
        include: {
          votes: { include: { user: { select: { username: true, discordId: true } } } },
          _count: { select: { votes: true } },
        },
        orderBy: { position: "asc" },
      },
      _count: { select: { votes: true } },
    },
  });

  if (!check) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(check);
}
