"use client";

import { useState } from "react";
import axios from "axios";
import { Gift, Loader2, X } from "lucide-react";

export function CreateGiveawayButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    channelId: "",
    description: "",
    durationMinutes: "60",
    winnersCount: "1",
    requiredRoleId: "",
    minClaims: "0",
    pingEveryone: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.channelId) return;
    setLoading(true);
    try {
      await axios.post("/api/giveaways", form);
      setOpen(false);
      window.location.reload();
    } catch {}
    setLoading(false);
  }

  const Field = ({ label, name, value, type = "text", onChange, placeholder }: any) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
      />
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 transition-colors text-white font-semibold py-2 px-4 rounded-lg text-sm"
      >
        <Gift className="size-4" />
        Créer un giveaway
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-discord-darker border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">🎁 Nouveau Giveaway</h2>
              <button onClick={() => setOpen(false)}><X className="size-5 text-white/50" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Field label="Titre *" value={form.title} onChange={(v: string) => setForm((f) => ({ ...f, title: v }))} placeholder="Giveaway Nike Air Max" />
              <Field label="Channel ID *" value={form.channelId} onChange={(v: string) => setForm((f) => ({ ...f, channelId: v }))} placeholder="123456789" />
              <Field label="Description" value={form.description} onChange={(v: string) => setForm((f) => ({ ...f, description: v }))} placeholder="Décrivez le prix…" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Durée (minutes)" type="number" value={form.durationMinutes} onChange={(v: string) => setForm((f) => ({ ...f, durationMinutes: v }))} />
                <Field label="Gagnants" type="number" value={form.winnersCount} onChange={(v: string) => setForm((f) => ({ ...f, winnersCount: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min claims" type="number" value={form.minClaims} onChange={(v: string) => setForm((f) => ({ ...f, minClaims: v }))} />
                <Field label="Rôle requis (ID)" value={form.requiredRoleId} onChange={(v: string) => setForm((f) => ({ ...f, requiredRoleId: v }))} placeholder="Optionnel" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pingEveryone}
                  onChange={(e) => setForm((f) => ({ ...f, pingEveryone: e.target.checked }))}
                  className="size-4 accent-discord-blurple"
                />
                <span className="text-sm text-white/70">Ping @everyone</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !form.title || !form.channelId}
                  className="flex-1 flex items-center justify-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Créer
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm text-white/50 hover:text-white bg-white/5 rounded-lg">
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
