import { cn } from "@/lib/utils";

const VARIANTS = {
  default: "bg-white/10 text-white/60",
  blurple: "bg-discord-blurple/20 text-discord-blurple",
  green: "bg-discord-green/20 text-discord-green",
  red: "bg-discord-red/20 text-discord-red",
  yellow: "bg-discord-yellow/20 text-discord-yellow",
  fuchsia: "bg-discord-fuchsia/20 text-discord-fuchsia",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full", VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
