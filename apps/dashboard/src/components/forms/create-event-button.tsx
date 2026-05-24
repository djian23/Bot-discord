"use client";

import { useState } from "react";
import axios from "axios";
import { Plus, Loader2, X } from "lucide-react";

const MODES = ["PUBLIC", "VIP", "PRIVATE"] as const;

export function CreateEventButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    site: "",
    pasText: "",
    embedColor: "#5865F2",
    mode: "PUBLIC" as (typeof MODES)[number],
    allowedRoleId: "",
    defaultExpiresIn: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/events", {
        ...form,
        defaultExpiresIn: form.defaultExpiresIn ? parseInt(form.defaultExpiresIn) : undefined,
        allowedRoleId: form.allowedRoleId || undefined,
      });
      setResult(data);
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Erreur lors de la création");
    }
    setLoading(false);
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    if (result) window.location.reload();
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
        <Plus className="size-4" />
        Créer un event
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-discord-darker border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Créer un Event</h2>
              <button onClick={handleClose}><X className="size-5 text-white/50" /></button>
            </div>

            {result ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-discord-green">
                  <span className="text-2xl">✅</span>
                  <p className="font-semibold">Event créé !</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4 space-y-2 text-sm font-mono text-white/70">
                  <p>Source : <span className="text-white">#{result.event?.sourceChannelId}</span></p>
                  <p>Public : <span className="text-white">#{result.event?.publicChannelId}</span></p>
                  <p>Logs : <span className="text-white">#{result.event?.logsChannelId}</span></p>
                  <p className="break-all">Webhook URL :<br />
                    <span className="text-discord-blurple">{result.event?.webhookUrl}</span>
                  </p>
                </div>
                <button onClick={handleClose} className="w-full bg-discord-blurple text-white font-semibold py-2.5 rounded-lg text-sm">
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <Field label="Nom *" value={form.name} onChange={(v: string) => setForm((f) => ({ ...f, name: v }))} placeholder="PSG vs OM" />
                <Field label="Site" value={form.site} onChange={(v: string) => setForm((f) => ({ ...f, site: v }))} placeholder="PSG, Ticketmaster…" />
                <Field label="PAS" value={form.pasText} onChange={(v: string) => setForm((f) => ({ ...f, pasText: v }))} placeholder="30€ each" />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Mode</label>
                  <div className="flex gap-2">
                    {MODES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, mode: m }))}
                        className={`flex-1 text-xs py-2 rounded-lg transition-colors font-medium ${
                          form.mode === m ? "bg-discord-blurple text-white" : "bg-white/5 text-white/50 hover:text-white"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Couleur embed</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.embedColor}
                        onChange={(e) => setForm((f) => ({ ...f, embedColor: e.target.value }))}
                        className="size-10 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <span className="text-sm text-white/50 font-mono">{form.embedColor}</span>
                    </div>
                  </div>
                  <Field label="Expiration défaut (min)" value={form.defaultExpiresIn} onChange={(v: string) => setForm((f) => ({ ...f, defaultExpiresIn: v }))} type="number" placeholder="15" />
                </div>

                {form.mode !== "PUBLIC" && (
                  <Field label="Rôle autorisé (ID)" value={form.allowedRoleId} onChange={(v: string) => setForm((f) => ({ ...f, allowedRoleId: v }))} placeholder="ID du rôle requis" />
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading || !form.name}
                    className="flex-1 flex items-center justify-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm"
                  >
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    Créer
                  </button>
                  <button type="button" onClick={handleClose} className="px-4 py-2.5 text-sm text-white/50 hover:text-white bg-white/5 rounded-lg">
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
