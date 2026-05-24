"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Loader2, Copy, Check, Zap, Send, Save } from "lucide-react";
import { generateWtsMessage, WtsEvent, WtsStyle, WtsOptions, WtsTicket } from "@discord-manager/shared";

// ─── helpers ────────────────────────────────────────────────────────────────

function renderDiscordMarkdown(text: string): string {
  // Escape HTML entities first
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Bold: **text** → <strong>text</strong>
  const bolded = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Line breaks
  return bolded.replace(/\n/g, "<br/>");
}

// ─── types ───────────────────────────────────────────────────────────────────

interface TicketRow extends WtsTicket {}

interface EventRow {
  name: string;
  date: string;
  tickets: TicketRow[];
}

// ─── default state ────────────────────────────────────────────────────────────

function defaultTicket(): TicketRow {
  return { category: "", quantity: "DUO", price: "" };
}

function defaultEvent(): EventRow {
  return { name: "", date: "", tickets: [defaultTicket()] };
}

// ─── style button ────────────────────────────────────────────────────────────

const STYLES: { value: WtsStyle; label: string; emoji: string }[] = [
  { value: "HYPE", label: "Hype", emoji: "🔥" },
  { value: "MULTI", label: "Multi", emoji: "🚨" },
  { value: "MINIMAL", label: "Minimal", emoji: "🎫" },
  { value: "PREMIUM", label: "Premium", emoji: "💎" },
];

// ─── component ───────────────────────────────────────────────────────────────

export function WtsBuilder() {
  const [style, setStyle] = useState<WtsStyle>("HYPE");
  const [events, setEvents] = useState<EventRow[]>([defaultEvent()]);
  const [instantTransfer, setInstantTransfer] = useState(true);
  const [cta, setCta] = useState("DM FAST");
  const [channelId, setChannelId] = useState("");
  const [mentionRoleId, setMentionRoleId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // AI mode
  const [aiMode, setAiMode] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Actions
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── derived preview ───────────────────────────────────────────────────────

  const wtsEvents: WtsEvent[] = events
    .filter(e => e.name.trim())
    .map(e => ({
      name: e.name.trim(),
      date: e.date.trim() || undefined,
      tickets: e.tickets
        .filter(t => t.category.trim() || t.quantity.trim())
        .map(t => ({
          category: t.category.trim() || "CAT",
          quantity: t.quantity.trim() || "DUO",
          price: t.price?.trim() || undefined,
        })),
    }));

  const preview = wtsEvents.length
    ? generateWtsMessage(wtsEvents, { style, instantTransfer, cta: cta || "DM FAST" })
    : "";

  // ─── event/ticket mutation helpers ────────────────────────────────────────

  const updateEvent = useCallback((i: number, patch: Partial<EventRow>) => {
    setEvents(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  }, []);

  const addEvent = useCallback(() => {
    setEvents(prev => [...prev, defaultEvent()]);
  }, []);

  const removeEvent = useCallback((i: number) => {
    setEvents(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const updateTicket = useCallback((ei: number, ti: number, patch: Partial<TicketRow>) => {
    setEvents(prev => prev.map((e, eidx) => {
      if (eidx !== ei) return e;
      return {
        ...e,
        tickets: e.tickets.map((t, tidx) => tidx === ti ? { ...t, ...patch } : t),
      };
    }));
  }, []);

  const addTicket = useCallback((ei: number) => {
    setEvents(prev => prev.map((e, eidx) => {
      if (eidx !== ei) return e;
      return { ...e, tickets: [...e.tickets, defaultTicket()] };
    }));
  }, []);

  const removeTicket = useCallback((ei: number, ti: number) => {
    setEvents(prev => prev.map((e, eidx) => {
      if (eidx !== ei) return e;
      return { ...e, tickets: e.tickets.filter((_, tidx) => tidx !== ti) };
    }));
  }, []);

  // ─── AI parse ─────────────────────────────────────────────────────────────

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wts/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events.map((ev: any) => ({
          name: ev.name ?? "",
          date: ev.date ?? "",
          tickets: (ev.tickets ?? []).map((t: any) => ({
            category: t.category ?? "",
            quantity: t.quantity ?? "DUO",
            price: t.price ?? "",
          })),
        })));
      }
    } catch {
      setError("Erreur lors de l'analyse IA.");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── save draft ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/wts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          style,
          events: wtsEvents,
          content: preview,
          channelId: channelId || undefined,
          mentionRoleId: mentionRoleId || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setSavedId(data.id);
        setSuccess("Brouillon sauvegardé !");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error ?? "Erreur lors de la sauvegarde.");
      }
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  // ─── post to Discord ──────────────────────────────────────────────────────

  const handlePost = async () => {
    if (!preview || !channelId.trim()) {
      setError("Un Channel ID est requis pour poster.");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/wts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post",
          channelId: channelId.trim(),
          content: preview,
          mentionRoleId: mentionRoleId.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          wtsId: savedId ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess("Message posté sur Discord !");
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.error ?? "Erreur lors de l'envoi.");
      }
    } catch {
      setError("Erreur lors de l'envoi.");
    } finally {
      setPosting(false);
    }
  };

  // ─── copy ─────────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    if (!preview) return;
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ── LEFT: Form ─────────────────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Style selector */}
        <div className="bg-discord-darker rounded-xl p-4 border border-white/5">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Style</p>
          <div className="grid grid-cols-4 gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  style === s.value
                    ? "bg-discord-blurple text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Mode */}
        <div className="bg-discord-darker rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Mode IA</p>
            <button
              onClick={() => setAiMode(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                aiMode ? "bg-discord-blurple" : "bg-white/10"
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                aiMode ? "translate-x-4" : "translate-x-1"
              }`} />
            </button>
          </div>
          {aiMode && (
            <div className="space-y-2">
              <textarea
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                placeholder="ex: wts psg duo cat1 320€ rg gold 450€"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-discord-blurple"
              />
              <button
                onClick={handleAiParse}
                disabled={aiLoading || !aiText.trim()}
                className="flex items-center gap-2 px-3 py-1.5 bg-discord-blurple text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                Parser le texte
              </button>
            </div>
          )}
        </div>

        {/* Events list */}
        <div className="space-y-4">
          {events.map((ev, ei) => (
            <div key={ei} className="bg-discord-darker rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Événement {events.length > 1 ? ei + 1 : ""}
                </p>
                {events.length > 1 && (
                  <button
                    onClick={() => removeEvent(ei)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <input
                  value={ev.name}
                  onChange={e => updateEvent(ei, { name: e.target.value })}
                  placeholder="Nom de l'événement"
                  className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
                />
                <input
                  value={ev.date}
                  onChange={e => updateEvent(ei, { date: e.target.value })}
                  placeholder="Date (ex: 14 juin)"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
                />
              </div>

              {/* Tickets */}
              <div className="space-y-2">
                <p className="text-xs text-white/30 uppercase tracking-wider">Places</p>
                {ev.tickets.map((t, ti) => (
                  <div key={ti} className="flex gap-2 items-center">
                    <input
                      value={t.category}
                      onChange={e => updateTicket(ei, ti, { category: e.target.value })}
                      placeholder="Catégorie"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
                    />
                    <input
                      value={t.quantity}
                      onChange={e => updateTicket(ei, ti, { quantity: e.target.value })}
                      placeholder="Qté"
                      className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
                    />
                    <input
                      value={t.price ?? ""}
                      onChange={e => updateTicket(ei, ti, { price: e.target.value })}
                      placeholder="Prix"
                      className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
                    />
                    <button
                      onClick={() => removeTicket(ei, ti)}
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addTicket(ei)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mt-1"
                >
                  <Plus className="size-3.5" /> Ajouter une place
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addEvent}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <Plus className="size-4" /> Ajouter un événement
          </button>
        </div>

        {/* Options */}
        <div className="bg-discord-darker rounded-xl p-4 border border-white/5 space-y-3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Options</p>

          {/* Instant transfer toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Instant transfer</span>
            <button
              onClick={() => setInstantTransfer(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                instantTransfer ? "bg-discord-blurple" : "bg-white/10"
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                instantTransfer ? "translate-x-4" : "translate-x-1"
              }`} />
            </button>
          </div>

          {/* CTA */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Call to action</label>
            <input
              value={cta}
              onChange={e => setCta(e.target.value)}
              placeholder="DM FAST"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
            />
          </div>

          {/* Channel ID */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Channel ID Discord</label>
            <input
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="123456789012345678"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
            />
          </div>

          {/* Ping role */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Ping Role ID (optionnel)</label>
            <input
              value={mentionRoleId}
              onChange={e => setMentionRoleId(e.target.value)}
              placeholder="Role ID"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Image URL (optionnel)</label>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
            />
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            {success}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !preview}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Draft
          </button>
          <button
            onClick={handlePost}
            disabled={posting || !preview || !channelId.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/90 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Post to Discord
          </button>
        </div>
      </div>

      {/* ── RIGHT: Preview ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Aperçu Discord</p>
          <button
            onClick={handleCopy}
            disabled={!preview}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors disabled:opacity-30"
          >
            {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>

        <div className="bg-[#313338] rounded-xl p-5 border border-white/5 min-h-[300px] font-[Whitney,_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif] text-[0.9375rem] leading-[1.375]">
          {preview ? (
            <div
              className="text-[#dbdee1] whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderDiscordMarkdown(preview) }}
            />
          ) : (
            <p className="text-white/20 text-sm italic">
              Remplissez le formulaire pour voir l'aperçu…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
