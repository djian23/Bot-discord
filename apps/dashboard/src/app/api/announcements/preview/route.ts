import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import type { AnnouncementStyle } from "@discord-manager/database";

const STYLE_PROMPTS: Record<string, string> = {
  HYPE: "Style hype, énergique, avec emojis feu, éclairs et fusées.",
  PRO: "Style professionnel. Peu d'emojis. Ton formel.",
  LUXE: "Style luxueux et exclusif. Emojis diamant et couronne.",
  MINIMAL: "Style minimaliste. Très peu d'emojis. Concis.",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rawContent, style } = await req.json();
  if (!rawContent) return NextResponse.json({ error: "Missing content" }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const stylePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.HYPE;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es expert en communication Discord. ${stylePrompt} Réponds UNIQUEMENT en JSON : {"title":"...","content":"...","embedColor":"#HEXCOLOR"}`,
        },
        { role: "user", content: rawContent },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const text = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ title: "", content: rawContent, embedColor: "#5865F2" });
  }
}
