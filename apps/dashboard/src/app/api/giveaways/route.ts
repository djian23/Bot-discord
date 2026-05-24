import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import botApi from "@/lib/botApi";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!["BOSS", "ADMIN", "STAFF"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, channelId, description, durationMinutes, winnersCount, requiredRoleId, minClaims, pingEveryone } = body;

  if (!title || !channelId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    const { data } = await botApi.post("/giveaways", {
      title,
      channelId,
      description: description || undefined,
      durationMinutes: parseInt(durationMinutes) || 60,
      winnersCount: parseInt(winnersCount) || 1,
      requiredRoleId: requiredRoleId || undefined,
      minClaims: parseInt(minClaims) || 0,
      pingEveryone: Boolean(pingEveryone),
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Bot unreachable" }, { status: 503 });
  }
}
