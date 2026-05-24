"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Lock } from "lucide-react";

export function TicketActions({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  async function closeTicket() {
    try {
      await axios.post(`/api/tickets/${ticketId}`, { action: "close" });
      toast("Ticket fermé", "success");
      router.refresh();
    } catch {
      toast("Erreur — le bot est peut-être hors ligne", "error");
    }
  }

  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl p-4 flex gap-3">
      <ConfirmDialog
        title="Fermer le ticket"
        description="Le ticket sera fermé et un transcript généré."
        onConfirm={closeTicket}
        trigger={
          <button className="flex items-center gap-2 bg-discord-red/10 hover:bg-discord-red/20 text-discord-red border border-discord-red/20 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Lock className="size-4" />
            Fermer le ticket
          </button>
        }
      />
    </div>
  );
}
