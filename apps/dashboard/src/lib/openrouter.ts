import { prisma } from "@discord-manager/database";

export interface AiSettingsConfig {
  id: string;
  guildId: string;
  enabled: boolean;
  openrouterApiKey: string | null;
  mainModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
  enableFallback: boolean;
  enableLogs: boolean;
}

interface OpenRouterResponse {
  text: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

async function saveLog(
  aiSettingsId: string,
  type: string,
  model: string,
  input: string,
  output: string | null,
  tokens: number | null,
  latency: number | null,
  success: boolean,
  error?: string,
): Promise<void> {
  try {
    await prisma.aiLog.create({
      data: {
        aiSettingsId,
        type,
        model,
        input,
        output,
        tokensUsed: tokens,
        latencyMs: latency,
        success,
        error,
      },
    });
  } catch {
    // Log failures must not break the response
  }
}

async function callOpenRouterWithModel(
  prompt: string,
  systemPrompt: string,
  config: AiSettingsConfig,
  modelToUse: string,
): Promise<{ text: string; tokensUsed: number }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://discord-manager.app",
      "X-Title": "Discord Manager",
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
    signal: AbortSignal.timeout(config.timeoutSeconds * 1000),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  const tokensUsed: number = data.usage?.total_tokens ?? 0;

  return { text, tokensUsed };
}

export async function callOpenRouter(
  prompt: string,
  systemPrompt: string,
  config: AiSettingsConfig,
  type: string,
): Promise<OpenRouterResponse> {
  const start = Date.now();
  let modelUsed = config.mainModel;

  try {
    const { text, tokensUsed } = await callOpenRouterWithModel(
      prompt,
      systemPrompt,
      config,
      config.mainModel,
    );
    const latencyMs = Date.now() - start;

    if (config.enableLogs) {
      await saveLog(config.id, type, config.mainModel, prompt, text, tokensUsed, latencyMs, true);
    }

    return { text, model: config.mainModel, tokensUsed, latencyMs };
  } catch (mainErr) {
    const mainLatency = Date.now() - start;

    if (config.enableLogs) {
      await saveLog(
        config.id,
        type,
        config.mainModel,
        prompt,
        null,
        null,
        mainLatency,
        false,
        mainErr instanceof Error ? mainErr.message : String(mainErr),
      );
    }

    if (!config.enableFallback) {
      throw mainErr;
    }

    // Try fallback model
    const fallbackStart = Date.now();
    modelUsed = config.fallbackModel;

    try {
      const { text, tokensUsed } = await callOpenRouterWithModel(
        prompt,
        systemPrompt,
        config,
        config.fallbackModel,
      );
      const latencyMs = Date.now() - fallbackStart;

      if (config.enableLogs) {
        await saveLog(
          config.id,
          type,
          config.fallbackModel,
          prompt,
          text,
          tokensUsed,
          latencyMs,
          true,
        );
      }

      return { text, model: config.fallbackModel, tokensUsed, latencyMs };
    } catch (fallbackErr) {
      const fallbackLatency = Date.now() - fallbackStart;

      if (config.enableLogs) {
        await saveLog(
          config.id,
          type,
          config.fallbackModel,
          prompt,
          null,
          null,
          fallbackLatency,
          false,
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        );
      }

      throw fallbackErr;
    }
  }
}

export async function generateWTS(input: string, config: AiSettingsConfig): Promise<string> {
  const systemPrompt =
    "Tu es un générateur de messages WTS Discord pour la revente de billets. Génère un message court, impactant, avec emojis Discord. Format: titre event en caps, date si connue, catégorie, quantité, prix each, transfer instant, legit seller, DM fast. Réponds UNIQUEMENT avec le message WTS formaté, rien d'autre.";
  const result = await callOpenRouter(input, systemPrompt, config, "WTS");
  return result.text;
}

export async function rewriteMessage(input: string, config: AiSettingsConfig): Promise<string> {
  const systemPrompt =
    "Tu es un expert en communication Discord. Reformule le texte fourni pour le rendre plus impactant, accrocheur et adapté à Discord. Utilise des emojis pertinents. Garde le sens original mais améliore le style et l'impact. Réponds UNIQUEMENT avec le texte reformulé, rien d'autre.";
  const result = await callOpenRouter(input, systemPrompt, config, "REWRITE");
  return result.text;
}

export async function generateEmbed(
  input: string,
  config: AiSettingsConfig,
): Promise<{ title: string; description: string; color: string }> {
  const systemPrompt =
    'Tu es un générateur d\'embeds Discord. Génère un objet JSON avec les champs "title", "description" et "color" (couleur hex comme "#5865F2"). Le titre doit être court et percutant. La description doit être détaillée avec des emojis Discord. Réponds UNIQUEMENT avec le JSON valide, sans markdown ni balises de code.';
  const result = await callOpenRouter(input, systemPrompt, config, "EMBED");

  try {
    // Strip possible markdown code fences
    const clean = result.text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      title: parsed.title ?? "Titre",
      description: parsed.description ?? "",
      color: parsed.color ?? "#5865F2",
    };
  } catch {
    return {
      title: "Embed généré",
      description: result.text,
      color: "#5865F2",
    };
  }
}

export async function generateAnnouncement(input: string, config: AiSettingsConfig): Promise<string> {
  const systemPrompt =
    "Tu es un expert en communication Discord pour des serveurs de revente de billets. Génère une annonce professionnelle et percutante avec des emojis Discord adaptés. L'annonce doit être claire, structurée et inciter à l'action. Réponds UNIQUEMENT avec l'annonce formatée, rien d'autre.";
  const result = await callOpenRouter(input, systemPrompt, config, "ANNOUNCEMENT");
  return result.text;
}

export async function parseWTS(
  text: string,
  config: AiSettingsConfig,
): Promise<{ event?: string; category?: string; quantity?: string; price?: string; date?: string }> {
  const systemPrompt =
    'Tu es un extracteur d\'informations de messages WTS (Want To Sell) de billets. Analyse le texte et extrais les informations suivantes si présentes: "event" (nom de l\'événement), "category" (catégorie de places), "quantity" (nombre de billets), "price" (prix par billet), "date" (date de l\'événement). Réponds UNIQUEMENT avec un objet JSON valide contenant ces champs (omets les champs non trouvés), sans markdown ni balises de code.';
  const result = await callOpenRouter(text, systemPrompt, config, "PARSE");

  try {
    const clean = result.text.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {};
  }
}
