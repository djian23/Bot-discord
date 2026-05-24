"use client";

import { useState } from "react";
import { Hammer, Search, Wrench, CheckCircle2, AlertCircle, Circle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SectionStat {
  total: number;
  created: number;
  status: "complete" | "partial" | "missing";
}

interface Channel {
  id: string;
  slug: string;
  name: string;
  section: string | null;
  channelRole: string | null;
  discordId: string;
  isEnabled: boolean;
  isPrivate: boolean;
}

interface ServerBuilderProps {
  sectionStats: Record<string, SectionStat>;
  channels: Channel[];
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  complete: <CheckCircle2 className="size-4 text-discord-green" />,
  partial: <AlertCircle className="size-4 text-yellow-400" />,
  missing: <Circle className="size-4 text-white/30" />,
};

const STATUS_LABEL: Record<string, string> = {
  complete: "Complet",
  partial: "Partiel",
  missing: "Manquant",
};

const STATUS_BAR: Record<string, string> = {
  complete: "bg-discord-green",
  partial: "bg-yellow-400",
  missing: "bg-white/10",
};

type Action = "build" | "scan" | "repair" | null;

export function ServerBuilder({ sectionStats, channels }: ServerBuilderProps) {
  const [loading, setLoading] = useState<Action>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function runAction(action: "build" | "scan" | "repair", sections?: string[]) {
    setLoading(action);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/server-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sections }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
      } else {
        if (action === "build") {
          setResult(`Construit: ${data.created} créés, ${data.skipped} ignorés, ${data.errors} erreurs`);
        } else if (action === "scan") {
          setResult(`Scan: ${data.ok} ok, ${data.updated} mis à jour, ${data.missing} manquants`);
        } else {
          setResult(`Réparation: ${data.repaired} réparés, ${data.errors} erreurs`);
        }
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  const sections = Object.entries(sectionStats);

  return (
    <div className="space-y-6">
      {/* Global Actions */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Actions globales</h2>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            icon={<Hammer className="size-4" />}
            label="Build All"
            description="Crée toutes les catégories et channels manquants"
            loading={loading === "build"}
            onClick={() => runAction("build")}
            variant="blurple"
          />
          <ActionButton
            icon={<Search className="size-4" />}
            label="Scan"
            description="Détecte les canaux supprimés ou renommés"
            loading={loading === "scan"}
            onClick={() => runAction("scan")}
            variant="default"
          />
          <ActionButton
            icon={<Wrench className="size-4" />}
            label="Repair"
            description="Recrée les canaux manquants en BDD"
            loading={loading === "repair"}
            onClick={() => runAction("repair")}
            variant="yellow"
          />
        </div>

        {result && (
          <div className="mt-4 px-4 py-2 bg-discord-green/10 border border-discord-green/20 rounded-lg text-sm text-discord-green">
            {result}
          </div>
        )}
        {error && (
          <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Section Status Grid */}
      <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sections.map(([section, stat]) => (
            <div key={section} className="bg-black/20 border border-white/5 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {STATUS_ICON[stat.status]}
                  <span className="text-sm font-medium text-white truncate">{section}</span>
                </div>
                <span className="text-xs text-white/40 shrink-0">{stat.created}/{stat.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${STATUS_BAR[stat.status]} transition-all`}
                  style={{ width: `${stat.total ? (stat.created / stat.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">{STATUS_LABEL[stat.status]}</span>
                <div className="flex gap-1.5">
                  <SectionActionBtn
                    icon={<Hammer className="size-3" />}
                    label="Build"
                    loading={loading === "build"}
                    onClick={() => runAction("build", [section])}
                  />
                  <SectionActionBtn
                    icon={<Wrench className="size-3" />}
                    label="Repair"
                    loading={loading === "repair"}
                    onClick={() => runAction("repair", [section])}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Table */}
      {channels.length > 0 && (
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Canaux créés ({channels.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-white/40 font-medium pb-2 pr-4">Nom</th>
                  <th className="text-left text-white/40 font-medium pb-2 pr-4">Section</th>
                  <th className="text-left text-white/40 font-medium pb-2 pr-4">Rôle</th>
                  <th className="text-left text-white/40 font-medium pb-2 pr-4">Privé</th>
                  <th className="text-left text-white/40 font-medium pb-2">Discord ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-white/2">
                    <td className="py-2 pr-4 text-white font-mono text-xs">#{ch.name}</td>
                    <td className="py-2 pr-4 text-white/60">{ch.section ?? "—"}</td>
                    <td className="py-2 pr-4 text-white/60">{ch.channelRole ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {ch.isPrivate ? (
                        <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Privé</span>
                      ) : (
                        <span className="text-xs text-white/30">Public</span>
                      )}
                    </td>
                    <td className="py-2 text-white/30 font-mono text-xs">{ch.discordId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  loading: boolean;
  onClick: () => void;
  variant: "blurple" | "default" | "yellow";
}

function ActionButton({ icon, label, description, loading, onClick, variant }: ActionButtonProps) {
  const variantClass = {
    blurple: "bg-discord-blurple hover:bg-discord-blurple/80 text-white",
    default: "bg-white/5 hover:bg-white/10 text-white",
    yellow: "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${variantClass}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      <div className="text-left">
        <div>{label}</div>
        <div className="text-xs opacity-60 font-normal">{description}</div>
      </div>
    </button>
  );
}

interface SectionActionBtnProps {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
}

function SectionActionBtn({ icon, label, loading, onClick }: SectionActionBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : icon}
    </button>
  );
}
