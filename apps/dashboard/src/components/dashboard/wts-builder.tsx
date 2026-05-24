"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Loader2, Send, Save, Copy, Check } from "lucide-react";
import { generateWtsMessage, detectEventEmoji, WtsEvent, WtsTicket, WtsStyle } from "@discord-manager/shared";

const STYLES: { value: WtsStyle; label: string; desc: string }[] = [
  { value: "HYPE",    label: "🔥 Hype",    desc: "1 event, style feu" },
  { value: "MULTI",   label: "🚨 Multi",   desc: "Plusieurs events" },
  { value: "MINIMAL", label: "🎫 Minimal", desc: "Simple et épuré" },
  { value: "PREMIUM", label: "💎 Premium", desc: "Top vendeur" },
];

const QTY_OPTIONS = ["SINGLE", "DUO", "3X", "4X", "5X", "6X"];

function emptyTicket(): WtsTicket { return { category: "", quantity: "DUO", price: "" }; }
function emptyEvent(): WtsEvent   { return { name: "", date: "", tickets: [emptyTicket()] }; }

function renderDiscordPreview(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export function WtsBuilder() {
  const [style, setStyle]           = useState<WtsStyle>("HYPE");
  const [events, setEvents]         = useState<WtsEvent[]>([emptyEvent()]);
  const [instantTransfer, setInstantTransfer] = useState(true);
  const [cta, setCta]               = useState("DM FAST");
  const [channelId, setChannelId]   = useState("");
  const [mentionRole, setMentionRole] = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [loading, setLoading]       = useState<"save" | "post" | null>(null);
  const [copied, setCopied]         = useState(false);
  const [toast, setToast]           = useState<string | null>(null);

  // Build clean events (filter empty)
  const cleanEvents = events.map(ev => ({
    ...ev,
    tickets: ev.tickets.map(t => ({
      ...t,
      price: t.price?.trim() || undefined,
    })).filter(t => t.category.trim()),
  })).filter(ev => ev.name.trim());

  const preview = cleanEvents.length
    ? generateWtsMessage(cleanEvents, { style, instantTransfer, cta: cta || "DM FAST" })
    : "Remplis les champs pour voir la prévisualisation…";

  // Events mutations
  function updateEvent(i: number, patch: Partial<WtsEvent>) {
    setEvents(prev => prev.map((ev, idx) => idx === i ? { ...ev, ...patch } : ev));
  }
  function addEvent() { setEvents(prev => [...prev, emptyEvent()]); }
  function removeEvent(i: number) { setEvents(prev => prev.filter((_, idx) => idx !== i)); }

  // Tickets mutations
  function updateTicket(ei: number, ti: number, patch: Partial<WtsTicket>) {
    setEvents(prev => prev.map((ev, idx) =>
      idx === ei
        ? { ...ev, tickets: ev.tickets.map((t, tIdx) => tIdx === ti ? { ...t, ...patch } : t) }
        : ev,
    ));
  }
  function addTicket(ei: number) {
    setEvents(prev => prev.map((ev, idx) =>
      idx === ei ? { ...ev, tickets: [...ev.tickets, emptyTicket()] } : ev,
    ));
  }
  function removeTicket(ei: number, ti: number) {
    setEvents(prev => prev.map((ev, idx) =>
      idx === ei ? { ...ev, tickets: ev.tickets.filter((_, tIdx) => tIdx !== ti) } : ev,
    ));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!cleanEvents.length) return;
    setLoading("save");
    await fetch("/api/wts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", style, events: cleanEvents, content: preview, channelId, mentionRoleId: mentionRole, imageUrl }),
    });
    setLoading(null);
    showToast("✅ Brouillon sauvegardé");
  }

  async function handlePost() {
    if (!cleanEvents.length || !channelId.trim()) {
      showToast("❌ Remplis au moins un event et l'ID du salon");
      return;
    }
    setLoading("post");
    const res = await fetch("/api/wts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "post", content: preview, channelId: channelId.trim(), mentionRoleId: mentionRole || undefined, imageUrl: imageUrl || undefined }),
    });
    const data = await res.json();
    setLoading(null);
    if (res.ok) showToast("🚀 Posté dans Discord !");
    else showToast(`❌ ${data.error}`);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ─── LEFT — FORM ─── */}
      <div className="space-y-5">

        {/* Style */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-4">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Style</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`py-2 px-3 rounded-lg text-sm text-left transition-colors ${
                  style === s.value
                    ? "bg-discord-blurple text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <div className="font-medium">{s.label}</div>
                <div className="text-xs opacity-60 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="space-y-3">
          {events.map((ev, ei) => (
            <div key={ei} className="bg-discord-darker border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{ev.name ? detectEventEmoji(ev.name) : "🎫"}</span>
                <input
                  value={ev.name}
                  onChange={e => updateEvent(ei, { name: e.target.value })}
                  placeholder="Nom de l'event (ex: PSG vs OM)"
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-discord-blurple"
                />
                <input
                  value={ev.date ?? ""}
                  onChange={e => updateEvent(ei, { date: e.target.value })}
                  placeholder="Date (ex: 14 Juin)"
                  className="w-32 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-discord-blurple"
                />
                {events.length > 1 && (
                  <button onClick={() => removeEvent(ei)} className="text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {/* Tickets */}
              <div className="space-y-2 pl-2 border-l border-white/5">
                {ev.tickets.map((t, ti) => (
                  <div key={ti} className="flex items-center gap-2">
                    <span className="text-xs text-white/30 w-4">{ti + 1}.</span>
                    <input
                      value={t.category}
                      onChange={e => updateTicket(ei, ti, { category: e.target.value })}
                      placeholder="Catégorie (CAT 1, VIP…)"
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/25 focus:outline-none focus:border-discord-blurple"
                    />
                    <select
                      value={t.quantity}
                      onChange={e => updateTicket(ei, ti, { quantity: e.target.value })}
                      className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-discord-blurple"
                    >
                      {QTY_OPTIONS.map(q => <option key={q}>{q}</option>)}
                    </select>
                    <div className="flex items-center bg-black/30 border border-white/10 rounded-lg px-2 py-1 gap-1">
                      <input
                        value={t.price ?? ""}
                        onChange={e => updateTicket(ei, ti, { price: e.target.value })}
                        placeholder="320"
                        className="w-14 bg-transparent text-xs text-white placeholder-white/25 focus:outline-none"
                      />
                      <span className="text-xs text-white/40">€ each</span>
                    </div>
                    {ev.tickets.length > 1 && (
                      <button onClick={() => removeTicket(ei, ti)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addTicket(ei)}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mt-1"
                >
                  <Plus className="size-3" /> Ajouter une place
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addEvent}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/10 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
          >
            <Plus className="size-4" /> Ajouter un event
          </button>
        </div>

        {/* Options */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Options</p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setInstantTransfer(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${instantTransfer ? "bg-discord-blurple" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${instantTransfer ? "left-4" : "left-0.5"}`} />
            </button>
            <span className="text-sm text-white/70">⚡ Instant transfer</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-white/40 mb-1">CTA</label>
              <input
                value={cta}
                onChange={e => setCta(e.target.value)}
                placeholder="DM FAST"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-discord-blurple"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Ping rôle (ID)</label>
              <input
                value={mentionRole}
                onChange={e => setMentionRole(e.target.value)}
                placeholder="optionnel"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-discord-blurple font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Salon Discord (ID)</label>
              <input
                value={channelId}
                onChange={e => setChannelId(e.target.value)}
                placeholder="ID du salon"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-discord-blurple font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Image URL (optionnel)</label>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-discord-blurple"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!!loading || !cleanEvents.length}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Sauvegarder
          </button>
          <button
            onClick={handlePost}
            disabled={!!loading || !cleanEvents.length || !channelId.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading === "post" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Poster dans Discord
          </button>
        </div>
      </div>

      {/* ─── RIGHT — PREVIEW ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Prévisualisation</p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors"
          >
            {copied ? <Check className="size-3 text-discord-green" /> : <Copy className="size-3" />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
        <div className="bg-[#36393f] border border-white/5 rounded-xl p-5 min-h-[400px] font-sans text-[15px] leading-[1.375] text-[#dcddde]">
          <div
            className="whitespace-pre-wrap break-words [&_strong]:text-white [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: renderDiscordPreview(preview) }}
          />
        </div>

        {toast && (
          <div className="px-4 py-2 bg-discord-darker border border-white/10 rounded-lg text-sm text-white text-center">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
