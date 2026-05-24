"use client";

import { useState } from "react";
import axios from "axios";

interface SettingsFormProps {
  guild: any;
}

function Field({
  label,
  name,
  value,
  type = "text",
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string | number;
  type?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
      />
    </div>
  );
}

export function SettingsForm({ guild }: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    bossRoleId: guild?.bossRoleId ?? "",
    adminRoleId: guild?.adminRoleId ?? "",
    staffRoleId: guild?.staffRoleId ?? "",
    vipRoleId: guild?.vipRoleId ?? "",
    successLogsChannelId: guild?.successLogsChannelId ?? "",
    errorLogsChannelId: guild?.errorLogsChannelId ?? "",
    staffLogsChannelId: guild?.staffLogsChannelId ?? "",
    defaultClaimsPerDay: String(guild?.defaultClaimsPerDay ?? 5),
    claimCooldownSeconds: String(guild?.claimCooldownSeconds ?? 0),
    blockNewAccounts: guild?.blockNewAccounts ?? false,
    minAccountAgeDays: String(guild?.minAccountAgeDays ?? 0),
    ticketAutoCloseHours: String(guild?.settings?.ticketAutoCloseHours ?? 48),
    openaiModel: guild?.settings?.openaiModel ?? "gpt-4o-mini",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch("/api/settings", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Rôles Discord</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Boss Role ID" name="bossRoleId" value={form.bossRoleId} onChange={set("bossRoleId")} placeholder="123456789" />
          <Field label="Admin Role ID" name="adminRoleId" value={form.adminRoleId} onChange={set("adminRoleId")} placeholder="123456789" />
          <Field label="Staff Role ID" name="staffRoleId" value={form.staffRoleId} onChange={set("staffRoleId")} placeholder="123456789" />
          <Field label="VIP Role ID" name="vipRoleId" value={form.vipRoleId} onChange={set("vipRoleId")} placeholder="123456789" />
        </div>
      </section>

      <section className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Salons Logs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Success Logs Channel ID" name="successLogsChannelId" value={form.successLogsChannelId} onChange={set("successLogsChannelId")} />
          <Field label="Error Logs Channel ID" name="errorLogsChannelId" value={form.errorLogsChannelId} onChange={set("errorLogsChannelId")} />
          <Field label="Staff Logs Channel ID" name="staffLogsChannelId" value={form.staffLogsChannelId} onChange={set("staffLogsChannelId")} />
        </div>
      </section>

      <section className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Claims & Sécurité</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Max claims/jour (défaut)" name="defaultClaimsPerDay" type="number" value={form.defaultClaimsPerDay} onChange={set("defaultClaimsPerDay")} />
          <Field label="Cooldown claim (secondes)" name="claimCooldownSeconds" type="number" value={form.claimCooldownSeconds} onChange={set("claimCooldownSeconds")} />
          <Field label="Âge compte minimum (jours)" name="minAccountAgeDays" type="number" value={form.minAccountAgeDays} onChange={set("minAccountAgeDays")} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.blockNewAccounts}
            onChange={(e) => setForm((f) => ({ ...f, blockNewAccounts: e.target.checked }))}
            className="size-4 accent-discord-blurple"
          />
          <span className="text-sm text-white/70">Bloquer les comptes récents</span>
        </label>
      </section>

      <section className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Tickets & IA</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Auto-close tickets (heures)" name="ticketAutoCloseHours" type="number" value={form.ticketAutoCloseHours} onChange={set("ticketAutoCloseHours")} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Modèle OpenAI</label>
            <select
              value={form.openaiModel}
              onChange={(e) => setForm((f) => ({ ...f, openaiModel: e.target.value }))}
              className="w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-discord-blurple"
            >
              <option value="gpt-4o-mini">gpt-4o-mini (rapide)</option>
              <option value="gpt-4o">gpt-4o (meilleur)</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 transition-colors text-white font-semibold py-2 px-6 rounded-lg text-sm"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        {saved && <span className="text-discord-green text-sm">✅ Sauvegardé !</span>}
      </div>
    </form>
  );
}
