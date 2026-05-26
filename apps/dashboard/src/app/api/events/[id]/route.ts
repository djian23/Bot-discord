import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes(getSessionUser(session)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (body.action === "toggle") {
      const event = await prisma.event.findUnique({ where: { id: params.id }, select: { status: true } });
      if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const newStatus = event.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await prisma.event.update({ where: { id: params.id }, data: { status: newStatus } });
      return NextResponse.json({ ok: true, status: newStatus });
    }

    if (body.action === "update_embed") {
      const { embedColor, embedTemplate } = body;
      await prisma.event.update({
        where: { id: params.id },
        data: {
          ...(embedColor ? { embedColor } : {}),
          ...(embedTemplate !== undefined ? { embedTemplate } : {}),
        },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[events/PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN"].includes(getSessionUser(session)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[events/DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
