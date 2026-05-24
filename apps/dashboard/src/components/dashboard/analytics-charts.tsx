"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StatCard } from "./stat-card";
import { ShoppingCart, CheckCircle, CreditCard, XCircle } from "lucide-react";

interface AnalyticsChartsProps {
  data: {
    topUsers: any[];
    topEvents: any[];
    claimsByDay: any[];
    totalCarts: number;
    totalClaims: number;
    totalPaid: number;
    totalCancelled: number;
    conversionRate: number;
  };
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const chartData = data.claimsByDay.map((s) => ({
    date: format(new Date(s.date), "dd/MM", { locale: fr }),
    carts: s.cartsReceived,
    claims: s.cartsClaimed,
    paid: s.cartsPaid,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Carts total" value={data.totalCarts} icon={<ShoppingCart className="size-5" />} color="blurple" />
        <StatCard title="Claims total" value={data.totalClaims} icon={<CheckCircle className="size-5" />} color="green" />
        <StatCard title="Paid total" value={data.totalPaid} icon={<CreditCard className="size-5" />} color="yellow" />
        <StatCard title="Conversion" value={`${data.conversionRate}%`} icon={<CreditCard className="size-5" />} color="fuchsia" />
      </div>

      {/* Claims par jour */}
      {chartData.length > 0 && (
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Carts & Claims (30 derniers jours)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: "#ffffff40", fontSize: 11 }} />
              <YAxis tick={{ fill: "#ffffff40", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#23272A", border: "1px solid #ffffff10", borderRadius: 8 }}
                labelStyle={{ color: "#ffffff80" }}
              />
              <Bar dataKey="carts" fill="#5865F2" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" fill="#57F287" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Top Users</h2>
          <div className="space-y-3">
            {data.topUsers.map((u, i) => (
              <div key={u.username} className="flex items-center gap-3">
                <span className="text-white/30 text-sm w-5">#{i + 1}</span>
                <span className="flex-1 text-sm text-white">{u.username}</span>
                <span className="text-xs text-discord-green">{u.claimsCount} claims</span>
              </div>
            ))}
            {data.topUsers.length === 0 && <p className="text-sm text-white/30">Aucune donnée.</p>}
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-discord-darker border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Top Events</h2>
          <div className="space-y-3">
            {data.topEvents.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3">
                <span className="text-white/30 text-sm w-5">#{i + 1}</span>
                <span className="flex-1 text-sm text-white">{e.name}</span>
                <span className="text-xs text-discord-blurple">{e._count.carts} carts</span>
              </div>
            ))}
            {data.topEvents.length === 0 && <p className="text-sm text-white/30">Aucune donnée.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
