"use client";

import { useState } from "react";
import axios from "axios";
import { Megaphone, Loader2, X, Wand2 } from "lucide-react";

const STYLES = ["HYPE", "PRO", "LUXE", "MINIMAL"] as const;
const PINGS = [
  { label: "Aucun", value: "none" },
  { label: "@everyone", value: "everyone" },
  { label: "@here", value: "here" },
];

export function CreateAnnouncementButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; content: string; embedColor: string } | null>(null);
  const [form, setForm] = useState({
    channelId: "",
    rawContent: "",
    isAiEnhanced: false,
    style: "HYPE" as (typeof STYLES)[number],
    pingType: "none",
  });

  async function handlePreview() {
    if (!form.rawContent) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/announcements/preview", {
        rawContent: form.rawContent,
        style: form.style,
      });
      setPreview(data);
    } catch {}
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.channelId || !form.rawContent) return;
    setLoading(true);
    try {
      await axios.post("/api/announcements", { ...form, pingType: form.pingType === "none" ? null : form.pingType });
      setOpen(false);
      setForm({ channelId: "", rawContent: "", isAiEnhanced: false, style: "HYPE", pingType: "none" });
      setPreview(null);
      window.location.reload();
    } catch {}
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 transition-colors text-white font-semibold py-2 px-4 rounded-lg text-sm"
      >
        <Megaphone className="size-4" />
        Nouvelle annonce
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-discord-darker border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Nouvelle annonce</h2>
              <button onClick={() => setOpen(false)}><X className="size-5 text-white/50" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Channel ID *</label>
                <input
                  value={form.channelId}
                  onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
                  placeholder="123456789012345678"
                  className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Contenu *</label>
                <textarea
                  value={form.rawContent}
                  onChange={(e) => setForm((f) => ({ ...f, rawContent: e.target.value }))}
                  placeholder="drop psg ce soir 20h places limitées"
                  rows={4}
                  className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAiEnhanced}
                  onChange={(e) => setForm((f) => ({ ...f, isAiEnhanced: e.target.checked }))}
                  className="size-4 accent-discord-blurple"
                />
                <span className="text-sm text-white/70">Améliorer avec l'IA</span>
              </label>

              {form.isAiEnhanced && (
                <div className="space-y-3 pl-4 border-l-2 border-discord-fuchsia/40">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/50 uppercase">Style</label>
                    <div className="flex gap-2 flex-wrap">
                      {STYLES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, style: s }))}
                          className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium ${
                            form.style === s
                              ? "bg-discord-fuchsia text-white"
                              : "bg-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {s === "HYPE" ? "🔥" : s === "PRO" ? "💼" : s === "LUXE" ? "💎" : "⚡"} {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={loading || !form.rawContent}
                    className="flex items-center gap-2 text-sm text-discord-fuchsia hover:text-discord-fuchsia/80 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                    Prévisualiser
                  </button>

                  {preview && (
                    <div
                      className="rounded-lg p-4 space-y-2 border-l-4 bg-black/20"
                      style={{ borderColor: preview.embedColor }}
                    >
                      {preview.title && <p className="font-bold text-white">{preview.title}</p>}
                      <p className="text-sm text-white/70 whitespace-pre-line">{preview.content}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Ping</label>
                <div className="flex gap-2">
                  {PINGS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, pingType: p.value }))}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium ${
                        form.pingType === p.value
                          ? "bg-discord-red text-white"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !form.channelId || !form.rawContent}
                  className="flex-1 flex items-center justify-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Envoyer
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm text-white/50 hover:text-white bg-white/5 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
