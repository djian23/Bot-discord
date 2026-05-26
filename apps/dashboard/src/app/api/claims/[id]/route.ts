import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = getSessionUser(session)?.role ?? "";
  if (!["BOSS", "ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
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
  } catch (err) {
    console.error("[claims/PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
