import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!["BOSS", "ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.status) {
    await prisma.claim.update({
      where: { id: params.id },
      data: {
        status: body.status,
        ...(body.status === "PAID" ? { paidAt: new Date() } : {}),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
