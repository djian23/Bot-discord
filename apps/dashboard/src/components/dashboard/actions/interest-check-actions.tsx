"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import { XCircle, PlayCircle } from "lucide-react";

interface InterestCheckActionsProps {
  checkId: string;
  isActive: boolean;
}

export function InterestCheckActions({ checkId, isActive }: InterestCheckActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await axios.post(`/api/interest-checks/${checkId}`, { action: isActive ? "close" : "reopen" });
      toast(isActive ? "Sondage fermé" : "Sondage rouvert", "success");
      router.refresh();
    } catch {
      toast("Erreur lors de l'action", "error");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-discord-red/10 hover:bg-discord-red/20 text-discord-red border-discord-red/20"
          : "bg-discord-green/10 hover:bg-discord-green/20 text-discord-green border-discord-green/20"
      }`}
    >
      {isActive ? <XCircle className="size-3.5" /> : <PlayCircle className="size-3.5" />}
      {loading ? "…" : isActive ? "Fermer" : "Rouvrir"}
    </button>
  );
}
