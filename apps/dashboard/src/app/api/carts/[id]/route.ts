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

  try {
    const { action } = await req.json();

    if (action === "expire") {
      await botApi.post(`/carts/${params.id}/expire`);
      return NextResponse.json({ ok: true });
    }

    if (action === "repost") {
      await botApi.post(`/carts/${params.id}/repost`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[carts/POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
