"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Ban, CheckCircle, StickyNote, Sliders } from "lucide-react";

interface UserActionsProps {
  user: any;
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [noteOpen, setNoteOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [note, setNote] = useState("");
  const [limit, setLimit] = useState(String(user.maxClaimsPerDay));
  const [loading, setLoading] = useState(false);

  async function action(payload: object) {
    setLoading(true);
    try {
      await axios.patch(`/api/users/${user.id}`, payload);
      toast("Action effectuée", "success");
      router.refresh();
    } catch {
      toast("Erreur", "error");
    }
    setLoading(false);
  }

  async function addNote() {
    if (!note.trim()) return;
    await action({ action: "add_note", note });
    setNote("");
    setNoteOpen(false);
  }

  async function setClaimsLimit() {
    await action({ action: "set_claims_limit", maxClaimsPerDay: limit });
    setLimitOpen(false);
  }

  return (
    <div className="bg-discord-darker border border-white/5 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Actions staff</h2>

      <div className="flex flex-wrap gap-2">
        {user.isBlacklisted ? (
          <ConfirmDialog
            title="Retirer le blacklist"
            description={`Retirer ${user.username} de la blacklist ?`}
            onConfirm={() => action({ action: "unblacklist" })}
            trigger={
              <button className="flex items-center gap-2 bg-discord-green/10 hover:bg-discord-green/20 text-discord-green border border-discord-green/20 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                <CheckCircle className="size-4" />
                Unblacklist
              </button>
            }
          />
        ) : (
          <ConfirmDialog
            title="Blacklister l'utilisateur"
            description={`Blacklister ${user.username} ? Il ne pourra plus claim de carts.`}
            onConfirm={() => action({ action: "blacklist", reason: "Blacklisté depuis le dashboard" })}
            trigger={
              <button className="flex items-center gap-2 bg-discord-red/10 hover:bg-discord-red/20 text-discord-red border border-discord-red/20 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                <Ban className="size-4" />
                Blacklist
              </button>
            }
          />
        )}

        <button
          onClick={() => setNoteOpen(!noteOpen)}
          className="flex items-center gap-2 bg-discord-yellow/10 hover:bg-discord-yellow/20 text-discord-yellow border border-discord-yellow/20 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <StickyNote className="size-4" />
          Ajouter note
        </button>

        <button
          onClick={() => setLimitOpen(!limitOpen)}
          className="flex items-center gap-2 bg-discord-blurple/10 hover:bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/20 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Sliders className="size-4" />
          Limite claims
        </button>
      </div>

      {noteOpen && (
        <div className="flex gap-2 mt-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note staff…"
            className="flex-1 bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-discord-blurple"
          />
          <button
            onClick={addNote}
            disabled={loading || !note.trim()}
            className="bg-discord-yellow/80 hover:bg-discord-yellow disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Ajouter
          </button>
          <button onClick={() => setNoteOpen(false)} className="text-white/40 hover:text-white px-2">✕</button>
        </div>
      )}

      {limitOpen && (
        <div className="flex gap-2 mt-2 items-center">
          <span className="text-sm text-white/60">Max claims/jour :</span>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            min="1"
            max="100"
            className="w-20 bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-discord-blurple"
          />
          <button
            onClick={setClaimsLimit}
            disabled={loading}
            className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Sauvegarder
          </button>
          <button onClick={() => setLimitOpen(false)} className="text-white/40 hover:text-white px-2">✕</button>
        </div>
      )}
    </div>
  );
}
