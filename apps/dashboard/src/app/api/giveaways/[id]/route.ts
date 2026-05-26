import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import botApi from "@/lib/botApi";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes(getSessionUser(session)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json();

  if (action === "end") {
    try {
      await botApi.post(`/giveaways/${params.id}/end`);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Bot unreachable" }, { status: 503 });
    }
  }

  if (action === "reroll") {
    try {
      await botApi.post(`/giveaways/${params.id}/reroll`);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Bot unreachable" }, { status: 503 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
