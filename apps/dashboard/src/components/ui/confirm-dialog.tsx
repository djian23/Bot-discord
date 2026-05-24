"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  trigger: React.ReactNode;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({ title, description, onConfirm, trigger, variant = "danger" }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-discord-darker border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-discord-red/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-discord-red" />
              </div>
              <div>
                <h3 className="font-bold text-white">{title}</h3>
                <p className="text-sm text-white/60 mt-1">{description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-discord-red hover:bg-discord-red/80 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                {loading ? "…" : "Confirmer"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
