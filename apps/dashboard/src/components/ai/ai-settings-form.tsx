"use client";

import { useState } from "react";

interface AiSettings {
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

const MODEL_OPTIONS = [
  { value: "deepseek/deepseek-v4-flash:free", label: "DeepSeek V4 Flash (free)" },
  { value: "qwen/qwen3-coder:free", label: "Qwen3 Coder (free)" },
  { value: "google/gemini-flash-1.5-8b", label: "Gemini Flash 1.5 8B" },
  { value: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B Instruct (free)" },
];

const GENERATE_TYPES = [
  { value: "WTS", label: "WTS" },
  { value: "REWRITE", label: "Réécriture" },
  { value: "ANNOUNCEMENT", label: "Annonce" },
];

interface Props {
  initial: AiSettings | null;
}

export function AiSettingsForm({ initial }: Props) {
  const [form, setForm] = useState({
    enabled: initial?.enabled ?? false,
    openrouterApiKey: initial?.openrouterApiKey ?? "",
    mainModel: initial?.mainModel ?? "deepseek/deepseek-v4-flash:free",
    fallbackModel: initial?.fallbackModel ?? "qwen/qwen3-coder:free",
    temperature: initial?.temperature ?? 0.7,
    maxTokens: initial?.maxTokens ?? 1024,
    timeoutSeconds: initial?.timeoutSeconds ?? 30,
    enableFallback: initial?.enableFallback ?? true,
    enableLogs: initial?.enableLogs ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [testInput, setTestInput] = useState("");
  const [testType, setTestType] = useState("WTS");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg({ ok: true, text: "Paramètres sauvegardés avec succès." });
      } else {
        setSaveMsg({ ok: false, text: data.error ?? "Une erreur est survenue." });
      }
    } catch {
      setSaveMsg({ ok: false, text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testInput.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: testType, input: testInput }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        const result = data.result;
        setTestResult(typeof result === "string" ? result : JSON.stringify(result, null, 2));
      } else {
        setTestError(data.error ?? "Erreur lors de la génération.");
      }
    } catch {
      setTestError("Erreur réseau.");
    } finally {
      setTestLoading(false);
    }
  }

  const inputClass =
    "w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple";
  const sectionHeader = "text-sm font-semibold text-white/60 uppercase tracking-wide mb-3";
  const cardClass = "bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4";
  const labelClass = "block text-sm text-white/80 mb-1";

  return (
    <div className="space-y-4">
      {/* Section 1: Configuration OpenRouter */}
      <div className={cardClass}>
        <p className={sectionHeader}>Configuration OpenRouter</p>

        <div>
          <label className={labelClass}>Clé API OpenRouter</label>
          <input
            type="password"
            placeholder="sk-or-..."
            value={form.openrouterApiKey}
            onChange={(e) => set("openrouterApiKey", e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-white/30 mt-1">
            Obtenez votre clé sur{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-discord-blurple hover:underline"
            >
              openrouter.ai/keys
            </a>
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Activer l&apos;IA</p>
            <p className="text-xs text-white/40">Active la génération de contenu IA</p>
          </div>
          <button
            type="button"
            onClick={() => set("enabled", !form.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.enabled ? "bg-discord-blurple" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Section 2: Modèles */}
      <div className={cardClass}>
        <p className={sectionHeader}>Modèles</p>

        <div>
          <label className={labelClass}>Modèle principal</label>
          <select
            value={form.mainModel}
            onChange={(e) => set("mainModel", e.target.value)}
            className={inputClass}
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Modèle de fallback</label>
          <select
            value={form.fallbackModel}
            onChange={(e) => set("fallbackModel", e.target.value)}
            className={inputClass}
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Activer le fallback</p>
            <p className="text-xs text-white/40">Utilise le modèle de secours en cas d&apos;erreur</p>
          </div>
          <button
            type="button"
            onClick={() => set("enableFallback", !form.enableFallback)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.enableFallback ? "bg-discord-blurple" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.enableFallback ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Section 3: Paramètres */}
      <div className={cardClass}>
        <p className={sectionHeader}>Paramètres</p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Température</label>
            <input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={form.temperature}
              onChange={(e) => set("temperature", parseFloat(e.target.value) || 0.7)}
              className={inputClass}
            />
            <p className="text-xs text-white/30 mt-1">0.0 – 2.0</p>
          </div>

          <div>
            <label className={labelClass}>Max Tokens</label>
            <input
              type="number"
              min={128}
              max={4096}
              step={64}
              value={form.maxTokens}
              onChange={(e) => set("maxTokens", parseInt(e.target.value) || 1024)}
              className={inputClass}
            />
            <p className="text-xs text-white/30 mt-1">128 – 4096</p>
          </div>

          <div>
            <label className={labelClass}>Timeout (s)</label>
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={form.timeoutSeconds}
              onChange={(e) => set("timeoutSeconds", parseInt(e.target.value) || 30)}
              className={inputClass}
            />
            <p className="text-xs text-white/30 mt-1">5 – 120 s</p>
          </div>
        </div>
      </div>

      {/* Section 4: Logs */}
      <div className={cardClass}>
        <p className={sectionHeader}>Logs</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Activer les logs</p>
            <p className="text-xs text-white/40">Enregistre les appels IA en base de données</p>
          </div>
          <button
            type="button"
            onClick={() => set("enableLogs", !form.enableLogs)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.enableLogs ? "bg-discord-blurple" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.enableLogs ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-discord-blurple hover:bg-discord-blurple/80 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>

        {saveMsg && (
          <span
            className={`text-sm ${saveMsg.ok ? "text-discord-green" : "text-discord-red"}`}
          >
            {saveMsg.text}
          </span>
        )}
      </div>

      {/* Section 5: Test IA */}
      <div className={cardClass}>
        <p className={sectionHeader}>Test IA</p>

        <div>
          <label className={labelClass}>Type de génération</label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className={inputClass}
          >
            {GENERATE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Texte d&apos;entrée</label>
          <textarea
            rows={4}
            placeholder="Entrez votre texte ici…"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className={inputClass + " resize-none"}
          />
        </div>

        <button
          type="button"
          onClick={handleTest}
          disabled={testLoading || !testInput.trim()}
          className="bg-discord-blurple hover:bg-discord-blurple/80 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testLoading ? "Génération…" : "Générer"}
        </button>

        {testError && (
          <div className="bg-discord-red/10 border border-discord-red/20 rounded-lg px-4 py-3">
            <p className="text-discord-red text-sm">{testError}</p>
          </div>
        )}

        {testResult && (
          <div>
            <p className="text-xs text-white/40 mb-1.5">Résultat :</p>
            <pre className="bg-discord-dark border border-white/10 rounded-lg p-4 text-sm text-white whitespace-pre-wrap font-mono overflow-x-auto">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
