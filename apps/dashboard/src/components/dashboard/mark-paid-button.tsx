"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface Props {
  claimId: string;
}

export function MarkPaidButton({ claimId }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok) {
        setDone(true);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-discord-green/80 hover:text-discord-green bg-discord-green/10 hover:bg-discord-green/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      <CheckCircle className="size-3.5" />
      {loading ? "…" : "Mark Paid"}
    </button>
  );
}
