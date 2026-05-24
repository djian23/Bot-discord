import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import botApi from "@/lib/botApi";
import { prisma } from "@discord-manager/database";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json();

  if (action === "expire") {
    await botApi.post(`/carts/${params.id}/expire`);
    return NextResponse.json({ ok: true });
  }

  if (action === "repost") {
    const cart = await prisma.cart.findUnique({ where: { id: params.id }, include: { event: true } });
    if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Trigger repost via bot API
    await botApi.post(`/carts/${params.id}/repost`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
