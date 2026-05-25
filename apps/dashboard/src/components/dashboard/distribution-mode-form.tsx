"use client";

import { useState } from "react";
import { Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "PUBLIC_CLAIM" | "DIRECT_TICKET" | "PUBLIC_ONLY" | "STAFF_REVIEW";

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  PUBLIC_CLAIM: "Repost public + bouton Claim → ticket",
  DIRECT_TICKET: "Envoi direct dans le ticket de l'utilisateur cible",
  PUBLIC_ONLY: "Repost public sans bouton",
  STAFF_REVIEW: "Review staff avant publication",
};

interface DistributionSettings {
  mode: string;
  targetUserId?: string | null;
  targetRoleId?: string | null;
  staffReviewChannelId?: string | null;
  notifyPushover?: boolean;
}

interface EventData {
  id: string;
  name: string;
}

interface Props {
  event: EventData;
  settings: DistributionSettings | null;
}

const inputCls =
  "w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple";

export function DistributionModeForm({ event, settings }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    mode: (settings?.mode ?? "PUBLIC_CLAIM") as Mode,
    targetUserId: settings?.targetUserId ?? "",
    targetRoleId: settings?.targetRoleId ?? "",
    staffReviewChannelId: settings?.staffReviewChannelId ?? "",
    notifyPushover: settings?.notifyPushover ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/distribution/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: form.mode,
          targetUserId: form.targetUserId || null,
          targetRoleId: form.targetRoleId || null,
          staffReviewChannelId: form.staffReviewChannelId || null,
          notifyPushover: form.notifyPushover,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur");
      }
      setSuccess(true);
      setTimeout(() => setOpen(false), 800);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Settings className="size-3.5" />
        Configurer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-discord-darker border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <h2 className="text-base font-bold text-white">Distribution — {event.name}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Mode selector */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Mode de distribution</label>
                <div className="space-y-2">
                  {(Object.keys(MODE_DESCRIPTIONS) as Mode[]).map((m) => (
                    <label
                      key={m}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        form.mode === m
                          ? "border-discord-blurple/50 bg-discord-blurple/10"
                          : "border-white/5 hover:border-white/10",
                      )}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value={m}
                        checked={form.mode === m}
                        onChange={() => setField("mode", m)}
                        className="mt-0.5 accent-discord-blurple"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{m}</p>
                        <p className="text-xs text-white/40">{MODE_DESCRIPTIONS[m]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* DIRECT_TICKET fields */}
              {form.mode === "DIRECT_TICKET" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Target User ID</label>
                    <input
                      type="text"
                      value={form.targetUserId}
                      onChange={(e) => setField("targetUserId", e.target.value)}
                      placeholder="Discord user ID"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Target Role ID</label>
                    <input
                      type="text"
                      value={form.targetRoleId}
                      onChange={(e) => setField("targetRoleId", e.target.value)}
                      placeholder="Discord role ID"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* STAFF_REVIEW fields */}
              {form.mode === "STAFF_REVIEW" && (
                <div>
                  <label className="block text-xs text-white/50 mb-1">Staff Review Channel ID</label>
                  <input
                    type="text"
                    value={form.staffReviewChannelId}
                    onChange={(e) => setField("staffReviewChannelId", e.target.value)}
                    placeholder="Discord channel ID"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Notify Pushover */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Notifier via Pushover</span>
                <button
                  type="button"
                  onClick={() => setField("notifyPushover", !form.notifyPushover)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    form.notifyPushover ? "bg-discord-blurple" : "bg-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                      form.notifyPushover ? "translate-x-4" : "translate-x-1",
                    )}
                  />
                </button>
              </div>

              {error && <p className="text-discord-red text-sm">{error}</p>}
              {success && <p className="text-discord-green text-sm">Sauvegardé !</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? "Sauvegarde…" : "Sauvegarder"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white/60 text-sm px-4 py-2 rounded-lg transition-colors"
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
