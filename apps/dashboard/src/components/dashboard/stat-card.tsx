import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blurple" | "green" | "yellow" | "fuchsia" | "red";
  subtitle?: string;
}

const COLORS = {
  blurple: "bg-discord-blurple/10 text-discord-blurple border-discord-blurple/20",
  green: "bg-discord-green/10 text-discord-green border-discord-green/20",
  yellow: "bg-discord-yellow/10 text-discord-yellow border-discord-yellow/20",
  fuchsia: "bg-discord-fuchsia/10 text-discord-fuchsia border-discord-fuchsia/20",
  red: "bg-discord-red/10 text-discord-red border-discord-red/20",
};

export function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl p-5 flex flex-col gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", COLORS[color])}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-white/50 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
