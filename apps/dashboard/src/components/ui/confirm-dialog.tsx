"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "danger" | "warning" | "default";
  // Uncontrolled mode: pass a trigger element
  trigger?: React.ReactNode;
  // Controlled mode: pass open + onCancel
  open?: boolean;
  onCancel?: () => void;
}

const CONFIRM_STYLES = {
  danger: "bg-discord-red hover:bg-discord-red/80 text-white",
  warning: "bg-discord-yellow hover:bg-discord-yellow/80 text-black",
  default: "bg-discord-blurple hover:bg-discord-blurple/80 text-white",
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmer",
  onConfirm,
  trigger,
  variant = "danger",
  open: controlledOpen,
  onCancel,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const close = onCancel ?? (() => setInternalOpen(false));

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    close();
  }

  return (
    <>
      {trigger && <span onClick={() => setInternalOpen(true)}>{trigger}</span>}
      {isOpen && (
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
                className={`flex-1 disabled:opacity-50 font-semibold py-2 rounded-lg text-sm transition-colors ${CONFIRM_STYLES[variant]}`}
              >
                {loading ? "…" : confirmLabel}
              </button>
              <button
                onClick={close}
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
