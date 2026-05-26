import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import botApi from "@/lib/botApi";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = getSessionUser(session)?.role ?? "";
  if (!["BOSS", "ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const { data } = await botApi.patch(`/events/${params.id}/distribution`, body);
    return NextResponse.json(data);
  } catch (err: any) {
    // If bot API is unavailable, update DB directly
    if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
      const { prisma } = await import("@discord-manager/database");
      await prisma.eventDistributionSettings.upsert({
        where: { eventId: params.id },
        create: { eventId: params.id, ...body },
        update: body,
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
