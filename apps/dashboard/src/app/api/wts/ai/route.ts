import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseWtsText } from "@discord-manager/shared";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Parse this WTS (Want To Sell) text into a structured JSON array. Return ONLY valid JSON, no markdown, no explanation.

Input: "${text}"

Output format (array of events):
[{"name":"EVENT NAME","date":"DATE or null","tickets":[{"category":"CAT NAME","quantity":"DUO|SINGLE|4X|3X|etc","price":"320€ each or null"}]}]

Rules:
- quantity: use DUO for 2, SINGLE for 1, 4X for 4, etc. Never change the price.
- price: always format as "XXX€ each" (per place price). If not specified, leave null.
- date: extract if mentioned (e.g. "14 juin", "5 juillet"), else null
- event name: capitalize properly (e.g. "PSG vs OM", "Roland Garros")
- If multiple events are mentioned, create one entry per event`
        }]
      });
      const json = (response.content[0] as any).text.trim();
      const events = JSON.parse(json);
      return NextResponse.json({ events });
    } catch (err) {
      // Fall through to basic parser
    }
  }

  // Fallback: basic regex parser
  const events = parseWtsText(text);
  return NextResponse.json({ events });
}
