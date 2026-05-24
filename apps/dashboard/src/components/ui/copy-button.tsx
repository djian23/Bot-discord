"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="text-white/40 hover:text-white transition-colors shrink-0"
      title="Copier"
    >
      {copied ? <Check className="size-3.5 text-discord-green" /> : <Copy className="size-3.5" />}
    </button>
  );
}
