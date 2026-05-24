"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "./stat-card";
import { ShoppingCart, CheckCircle, CreditCard, Ticket } from "lucide-react";

interface LiveStats {
  cartsToday: number;
  claimsToday: number;
  paidToday: number;
  openTickets: number;
}

interface LiveOverviewProps {
  initial: LiveStats;
}

export function LiveOverview({ initial }: LiveOverviewProps) {
  const [stats, setStats] = useState<LiveStats>(initial);
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";
    const socket = io(wsUrl, { transports: ["websocket"], reconnectionDelay: 3000 });
    socketRef.current = socket;

    socket.on("cart:new", (event: any) => {
      setStats((s) => ({ ...s, cartsToday: s.cartsToday + 1 }));
      toast(`Nouveau cart reçu`, "info");
    });

    socket.on("cart:claimed", (event: any) => {
      setStats((s) => ({ ...s, claimsToday: s.claimsToday + 1 }));
      toast(`Cart claim !`, "success");
    });

    socket.on("cart:paid", () => {
      setStats((s) => ({ ...s, paidToday: s.paidToday + 1 }));
      toast(`Cart marqué payé`, "success");
    });

    socket.on("cart:cancelled", () => {
      toast("Cart annulé", "warning");
    });

    socket.on("ticket:created", () => {
      setStats((s) => ({ ...s, openTickets: s.openTickets + 1 }));
    });

    socket.on("ticket:closed", () => {
      setStats((s) => ({ ...s, openTickets: Math.max(0, s.openTickets - 1) }));
    });

    socket.on("connect_error", () => {
      toast("Bot WebSocket déconnecté", "error");
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Carts reçus"
        value={stats.cartsToday}
        icon={<ShoppingCart className="size-5" />}
        color="blurple"
        subtitle="Aujourd'hui"
      />
      <StatCard
        title="Claims"
        value={stats.claimsToday}
        icon={<CheckCircle className="size-5" />}
        color="green"
        subtitle="Aujourd'hui"
      />
      <StatCard
        title="Paid"
        value={stats.paidToday}
        icon={<CreditCard className="size-5" />}
        color="yellow"
        subtitle="Aujourd'hui"
      />
      <StatCard
        title="Tickets ouverts"
        value={stats.openTickets}
        icon={<Ticket className="size-5" />}
        color="fuchsia"
      />
    </div>
  );
}
