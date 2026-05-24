"use client";

import { useState } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import { RefreshCw, Clock, MoreHorizontal } from "lucide-react";

interface CartRowActionsProps {
  cartId: string;
  status: string;
  onRefresh: () => void;
}

export function CartRowActions({ cartId, status, onRefresh }: CartRowActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function doAction(action: string, label: string) {
    setLoading(action);
    setOpen(false);
    try {
      await axios.post(`/api/carts/${cartId}`, { action });
      toast(label, "success");
      onRefresh();
    } catch {
      toast("Erreur — bot hors ligne ?", "error");
    }
    setLoading(null);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-white/30 hover:text-white transition-colors p-1 rounded"
        disabled={!!loading}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 bg-discord-dark border border-white/10 rounded-xl shadow-xl py-1 w-36">
            {status === "AVAILABLE" && (
              <button
                onClick={() => doAction("repost", "Cart reposté")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="size-3.5" />
                Reposter
              </button>
            )}
            {["AVAILABLE", "CLAIMED"].includes(status) && (
              <button
                onClick={() => doAction("expire", "Cart expiré")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-discord-red/80 hover:text-discord-red hover:bg-discord-red/5 transition-colors"
              >
                <Clock className="size-3.5" />
                Expirer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
