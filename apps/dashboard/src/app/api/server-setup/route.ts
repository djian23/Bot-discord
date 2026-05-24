import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import botApi from "@/lib/botApi";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data } = await botApi.get("/server/status");
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, sections } = body as { action: "build" | "scan" | "repair"; sections?: string[] };

  try {
    let data: any;
    if (action === "build") {
      ({ data } = await botApi.post("/server/build", { sections, skipExisting: true }));
    } else if (action === "scan") {
      ({ data } = await botApi.post("/server/scan", {}));
    } else if (action === "repair") {
      ({ data } = await botApi.post("/server/repair", { sections }));
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
