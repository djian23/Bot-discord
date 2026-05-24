"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";

export function BotStatus() {
  const [status, setStatus] = useState<{
    bot: boolean;
    uptime: number;
    cartsToday: number;
    openTickets: number;
  } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get("/api/bot/health");
        setStatus(data);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, []);

  const online = status?.bot === true;

  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
        Statut système
      </h2>
      <div className="space-y-3">
        <StatusRow
          label="Bot Discord"
          value={online ? "En ligne" : "Hors ligne"}
          online={online}
        />
        <StatusRow label="Database" value="Connected" online={true} />
        {status?.uptime !== undefined && (
          <StatusRow
            label="Uptime"
            value={formatUptime(status.uptime)}
            online={true}
          />
        )}
      </div>
    </div>
  );
}

function StatusRow({ label, value, online }: { label: string; value: string; online: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <div className={cn("size-2 rounded-full", online ? "bg-discord-green" : "bg-discord-red")} />
        <span className="text-sm text-white/80">{value}</span>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
