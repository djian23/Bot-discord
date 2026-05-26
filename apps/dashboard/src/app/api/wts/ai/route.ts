import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@discord-manager/database";
import { callOpenRouter } from "@/lib/openrouter";
import { parseWtsText } from "@discord-manager/shared";

const SYSTEM_PROMPT =
  'Tu es un extracteur de données WTS (Want To Sell) de billets. Analyse le texte et retourne un tableau JSON strictement valide. Format attendu: [{"name":"NOM ÉVÉNEMENT","date":"DATE ou null","tickets":[{"category":"NOM CAT","quantity":"DUO|SINGLE|4X|3X|etc","price":"320€ each ou null"}]}]. Règles: quantity = DUO pour 2, SINGLE pour 1, 4X pour 4, etc. price = toujours "XXX€ each" (prix par place). date = extraire si mentionnée (ex: "14 juin"), sinon null. Si plusieurs événements, un objet par événement. Réponds UNIQUEMENT avec le JSON valide, sans markdown ni explication.';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  // Try OpenRouter if AI is configured
  const guild = await prisma.guild.findFirst({ include: { aiSettings: true } });
  const ai = guild?.aiSettings;

  if (ai?.enabled && ai.openrouterApiKey) {
    try {
      const result = await callOpenRouter(text, SYSTEM_PROMPT, ai, "PARSE_WTS");
      const clean = result.text.replace(/```(?:json)?\n?/g, "").trim();
      const events = JSON.parse(clean);
      return NextResponse.json({ events });
    } catch {
      // Fall through to basic parser
    }
  }

  // Fallback: basic regex parser
  const events = parseWtsText(text);
  return NextResponse.json({ events });
}
