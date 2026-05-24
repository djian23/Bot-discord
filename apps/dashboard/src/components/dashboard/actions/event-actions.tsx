"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Power, Trash2 } from "lucide-react";

export function EventDetailActions({ event }: { event: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await axios.patch(`/api/events/${event.id}`, { action: "toggle" });
      toast(`Event ${event.status === "ACTIVE" ? "désactivé" : "activé"}`, "success");
      router.refresh();
    } catch {
      toast("Erreur", "error");
    }
    setLoading(false);
  }

  async function deleteEvent() {
    try {
      await axios.delete(`/api/events/${event.id}`);
      toast("Event supprimé", "success");
      router.push("/events");
    } catch {
      toast("Erreur", "error");
    }
  }

  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl p-4 flex flex-wrap gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-2 border text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
          event.status === "ACTIVE"
            ? "bg-discord-yellow/10 hover:bg-discord-yellow/20 text-discord-yellow border-discord-yellow/20"
            : "bg-discord-green/10 hover:bg-discord-green/20 text-discord-green border-discord-green/20"
        }`}
      >
        <Power className="size-4" />
        {event.status === "ACTIVE" ? "Désactiver" : "Activer"}
      </button>

      <ConfirmDialog
        title="Supprimer l'event"
        description={`Supprimer "${event.name}" ? Tous ses carts seront également supprimés.`}
        onConfirm={deleteEvent}
        trigger={
          <button className="flex items-center gap-2 bg-discord-red/10 hover:bg-discord-red/20 text-discord-red border border-discord-red/20 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Trash2 className="size-4" />
            Supprimer
          </button>
        }
      />
    </div>
  );
}
