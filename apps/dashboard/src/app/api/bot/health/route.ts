import { NextResponse } from "next/server";
import botApi from "@/lib/botApi";

export async function GET() {
  try {
    const { data } = await botApi.get("/health");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ bot: false, error: "unreachable" }, { status: 503 });
  }
}
