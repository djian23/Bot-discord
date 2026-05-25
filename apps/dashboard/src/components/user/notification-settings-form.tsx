"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface NotifSettings {
  pushoverUserKey?: string | null;
  enabled?: boolean;
  notifyPublicCarts?: boolean;
  notifyTicketCarts?: boolean;
  notifyClaims?: boolean;
  notifyPaid?: boolean;
  notifyExpired?: boolean;
  quietHoursStart?: number | null;
  quietHoursEnd?: number | null;
}

interface Props {
  userId: string;
  initial: NotifSettings | null;
}

export function NotificationSettingsForm({ userId, initial }: Props) {
  const [form, setForm] = useState<NotifSettings>({
    pushoverUserKey: initial?.pushoverUserKey ?? "",
    enabled: initial?.enabled ?? false,
    notifyPublicCarts: initial?.notifyPublicCarts ?? true,
    notifyTicketCarts: initial?.notifyTicketCarts ?? true,
    notifyClaims: initial?.notifyClaims ?? true,
    notifyPaid: initial?.notifyPaid ?? true,
    notifyExpired: initial?.notifyExpired ?? false,
    quietHoursStart: initial?.quietHoursStart ?? null,
    quietHoursEnd: initial?.quietHoursEnd ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function setField<K extends keyof NotifSettings>(key: K, value: NotifSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/my/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      setMessage({ type: "ok", text: "Paramètres sauvegardés !" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/my/notifications/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setMessage({ type: "ok", text: "Notification test envoyée !" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Pushover credentials */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
          Credentials Pushover
        </h2>
        <div>
          <label className="block text-xs text-white/50 mb-1">Pushover User Key</label>
          <input
            type="text"
            value={form.pushoverUserKey ?? ""}
            onChange={(e) => setField("pushoverUserKey", e.target.value)}
            placeholder="uXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple"
          />
        </div>
        <p className="text-xs text-white/30">
          L'App Token Pushover est configuré par l'administrateur dans les paramètres serveur.
        </p>
      </div>

      {/* Enabled toggle */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
        <Toggle
          label="Activer les notifications"
          checked={form.enabled ?? false}
          onChange={(v) => setField("enabled", v)}
        />
      </div>

      {/* Notification types */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
          Types de notifications
        </h2>
        <Toggle
          label="Paniers publics"
          checked={form.notifyPublicCarts ?? true}
          onChange={(v) => setField("notifyPublicCarts", v)}
        />
        <Toggle
          label="Paniers ticket"
          checked={form.notifyTicketCarts ?? true}
          onChange={(v) => setField("notifyTicketCarts", v)}
        />
        <Toggle
          label="Claims"
          checked={form.notifyClaims ?? true}
          onChange={(v) => setField("notifyClaims", v)}
        />
        <Toggle
          label="Payé"
          checked={form.notifyPaid ?? true}
          onChange={(v) => setField("notifyPaid", v)}
        />
        <Toggle
          label="Expiré"
          checked={form.notifyExpired ?? false}
          onChange={(v) => setField("notifyExpired", v)}
        />
      </div>

      {/* Quiet hours */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
          Heures silencieuses
        </h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">Heure de début (0-23)</label>
            <input
              type="number"
              min={0}
              max={23}
              value={form.quietHoursStart ?? ""}
              onChange={(e) =>
                setField("quietHoursStart", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="ex: 22"
              className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">Heure de fin (0-23)</label>
            <input
              type="number"
              min={0}
              max={23}
              value={form.quietHoursEnd ?? ""}
              onChange={(e) =>
                setField("quietHoursEnd", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="ex: 8"
              className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {message && (
        <p
          className={cn(
            "text-sm px-4 py-2 rounded-lg",
            message.type === "ok"
              ? "bg-discord-green/10 text-discord-green"
              : "bg-discord-red/10 text-discord-red",
          )}
        >
          {message.text}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/70 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-white/10"
        >
          {testing ? "Envoi…" : "Tester la notification"}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-discord-blurple" : "bg-white/10",
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
