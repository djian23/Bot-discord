export interface WtsTicket {
  category: string;
  quantity: string; // "DUO", "4X", "SINGLE", "x3"
  price?: string;   // "320€ each" — optional (staff fills manually if absent)
}

export interface WtsEvent {
  name: string;
  date?: string;
  emoji?: string; // override auto-detect
  tickets: WtsTicket[];
}

export type WtsStyle = "HYPE" | "MINIMAL" | "PREMIUM" | "MULTI";

export interface WtsOptions {
  style: WtsStyle;
  instantTransfer?: boolean; // default true
  cta?: string;              // default "DM FAST"
}

export function detectEventEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.match(/psg|foot|om|ligue|match|football|soccer/)) return "⚽";
  if (n.match(/tennis|roland|garros|\brg\b|wimbledon|us open/)) return "🎾";
  if (n.match(/concert|travis|drake|music|tour|live|festival|rap|pop/)) return "🎤";
  if (n.match(/basket|nba/)) return "🏀";
  if (n.match(/rugby/)) return "🏉";
  if (n.match(/f1|formule|grand prix|\bgp\b/)) return "🏎️";
  if (n.match(/boxe|mma|ufc|combat/)) return "🥊";
  return "🎫";
}

// Always bold (uses Discord **bold**), uses ─ separators
export function generateWtsMessage(events: WtsEvent[], options: WtsOptions): string {
  const { style, instantTransfer = true, cta = "DM FAST" } = options;
  const SEP = "━━━━━━━━━━━━━━";
  const lines: string[] = [];

  function ticketLine(t: WtsTicket): string {
    const price = t.price ? ` — **${t.price}**` : " — **___€ each**";
    return `🎟️ **${t.category}** — **${t.quantity}**${price}`;
  }

  if (style === "MINIMAL") {
    const ev = events[0];
    lines.push(`🎫 **WTS ${ev.name.toUpperCase()}**`);
    lines.push("");
    if (ev.date) lines.push(`📅 **${ev.date}**`);
    ev.tickets.forEach(t => lines.push(ticketLine(t)));

  } else if (style === "PREMIUM") {
    const ev = events[0];
    lines.push(`🚨 **PREMIUM WTS** 🚨`);
    lines.push("");
    lines.push(`🔥 **${ev.name.toUpperCase()}**`);
    lines.push("");
    if (ev.date) lines.push(`📅 **${ev.date}**`);
    ev.tickets.forEach(t => lines.push(ticketLine(t)));

  } else if (style === "HYPE" && events.length === 1) {
    const ev = events[0];
    lines.push(`🔥 **WTS ${ev.name.toUpperCase()}** 🔥`);
    lines.push("");
    if (ev.date) lines.push(`📅 **${ev.date}**`);
    ev.tickets.forEach(t => lines.push(ticketLine(t)));

  } else {
    // MULTI or HYPE with multiple events
    lines.push(`🚨 **WTS AVAILABLE** 🚨`);
    lines.push("");
    events.forEach((ev, i) => {
      const emoji = ev.emoji ?? detectEventEmoji(ev.name);
      lines.push(`${emoji} **${ev.name.toUpperCase()}**`);
      if (ev.date) lines.push(`📅 **${ev.date}**`);
      ev.tickets.forEach(t => lines.push(ticketLine(t)));
      if (i < events.length - 1) {
        lines.push("");
        lines.push(SEP);
        lines.push("");
      }
    });
  }

  lines.push("");
  if (instantTransfer) lines.push("⚡ **Instant transfer**");
  lines.push("✅ **LEGIT SELLER**");
  lines.push("");
  lines.push(`📩 **${cta}**`);

  return lines.join("\n");
}

// Simple natural-language parser: "wts psg duo cat1 320 cat2 220 rg gold 450"
// Groups by known event keywords, extracts cat/qty/price patterns
export function parseWtsText(text: string): WtsEvent[] {
  // Normalize
  const t = text.toLowerCase().trim();
  // Split on known separators or "event" keywords
  // Strategy: find segments that look like "eventname tickets..."
  // This is a best-effort parser — AI mode uses Claude for accuracy
  const events: WtsEvent[] = [];

  // Remove "wts" prefix
  const cleaned = t.replace(/^wts\s*/i, "").trim();

  // Split by common multi-event separators
  const segments = cleaned.split(/\s*[\/\|]\s*|\s+(?=(?:psg|om|rg|roland|travis|concert|match|garros|nba))/i);

  for (const seg of segments) {
    if (!seg.trim()) continue;
    const tokens = seg.trim().split(/\s+/);
    if (!tokens.length) continue;

    const tickets: WtsTicket[] = [];
    let eventName = "";
    let i = 0;

    // First token(s) = event name (until we hit qty keyword or price)
    while (i < tokens.length && !tokens[i].match(/^(duo|single|4x|3x|2x|x\d|\d+x|\d+€|\d+$)/i)) {
      eventName += (eventName ? " " : "") + tokens[i];
      i++;
    }

    // Remaining = tickets: cat qty price pattern
    while (i < tokens.length) {
      const cat = tokens[i] || "CAT";
      i++;
      const qty = tokens[i]?.match(/^(duo|single|4x|3x|2x|x\d|\d+x)$/i) ? tokens[i++].toUpperCase() : "SINGLE";
      const priceRaw = tokens[i]?.match(/^\d+/) ? tokens[i++] : undefined;
      const price = priceRaw ? `${parseFloat(priceRaw)}€ each` : undefined;
      tickets.push({ category: cat.toUpperCase(), quantity: qty, price });
    }

    if (eventName) {
      events.push({ name: eventName.trim(), tickets: tickets.length ? tickets : [{ category: "CAT 1", quantity: "DUO" }] });
    }
  }

  return events.length ? events : [{ name: cleaned, tickets: [{ category: "CAT 1", quantity: "DUO" }] }];
}
