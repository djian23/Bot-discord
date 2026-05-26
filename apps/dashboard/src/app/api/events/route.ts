import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSessionUser } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import botApi from "@/lib/botApi";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = getSessionUser(session)?.role ?? "";
  if (!["BOSS", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const { data } = await botApi.post("/events", body);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.response?.data?.error ?? "Error" }, { status: 400 });
  }
}
