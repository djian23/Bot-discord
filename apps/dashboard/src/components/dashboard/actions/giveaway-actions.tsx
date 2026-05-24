"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trophy, RotateCcw } from "lucide-react";

interface GiveawayActionsProps {
  giveawayId: string;
  status: string;
}

export function GiveawayActions({ giveawayId, status }: GiveawayActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"end" | "reroll" | null>(null);

  async function doAction(action: "end" | "reroll") {
    setLoading(action);
    setConfirm(null);
    try {
      await axios.post(`/api/giveaways/${giveawayId}`, { action });
      toast(action === "end" ? "Giveaway terminé !" : "Reroll effectué !", "success");
      router.refresh();
    } catch {
      toast("Erreur — bot hors ligne ?", "error");
    }
    setLoading(null);
  }

  if (status !== "ACTIVE") return null;

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirm("end")}
          disabled={!!loading}
          className="flex items-center gap-1.5 text-xs bg-discord-yellow/10 hover:bg-discord-yellow/20 text-discord-yellow border border-discord-yellow/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trophy className="size-3.5" />
          {loading === "end" ? "…" : "Terminer"}
        </button>
        <button
          onClick={() => setConfirm("reroll")}
          disabled={!!loading}
          className="flex items-center gap-1.5 text-xs bg-discord-blurple/10 hover:bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" />
          {loading === "reroll" ? "…" : "Reroll"}
        </button>
      </div>

      <ConfirmDialog
        open={confirm === "end"}
        title="Terminer le giveaway ?"
        description="Le tirage au sort sera effectué immédiatement et le giveaway sera clôturé."
        confirmLabel="Terminer"
        variant="warning"
        onConfirm={() => doAction("end")}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "reroll"}
        title="Reroll le giveaway ?"
        description="De nouveaux gagnants seront tirés au sort parmi les participants."
        confirmLabel="Reroll"
        variant="default"
        onConfirm={() => doAction("reroll")}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
