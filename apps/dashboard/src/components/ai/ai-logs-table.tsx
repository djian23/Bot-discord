"use client";

import { useEffect, useState, useCallback } from "react";

interface AiLog {
  id: string;
  type: string;
  model: string;
  input: string;
  output: string | null;
  tokensUsed: number | null;
  latencyMs: number | null;
  success: boolean;
  error: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortModel(model: string) {
  // e.g. "deepseek/deepseek-v4-flash:free" -> "deepseek-v4-flash"
  const parts = model.split("/");
  const last = parts[parts.length - 1] ?? model;
  return last.replace(/:.*$/, "");
}

export function AiLogsTable() {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/logs");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erreur lors du chargement des logs.");
        return;
      }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setError(null);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30_000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wide">Logs IA</p>
          <p className="text-xs text-white/30 mt-0.5">50 derniers appels — rafraîchissement auto 30s</p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchLogs(); }}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Rafraîchir
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 border-2 border-discord-blurple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 text-center">
          <p className="text-discord-red text-sm">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-white/30 text-sm">Aucun log disponible.</p>
          <p className="text-white/20 text-xs mt-1">Les logs apparaissent après les premières générations IA.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">
                  Modèle
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">
                  Tokens
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">
                  Latence
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white/80 font-medium">{log.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/50 font-mono text-xs">{shortModel(log.model)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      <span className="bg-discord-green/10 text-discord-green text-xs px-2 py-0.5 rounded">
                        OK
                      </span>
                    ) : (
                      <span
                        className="bg-discord-red/10 text-discord-red text-xs px-2 py-0.5 rounded cursor-help"
                        title={log.error ?? "Erreur inconnue"}
                      >
                        Erreur
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/50">
                      {log.tokensUsed != null ? log.tokensUsed.toLocaleString() : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/50">
                      {log.latencyMs != null ? `${log.latencyMs} ms` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/40 text-xs">{formatDate(log.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
