"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  href: string;
  label?: string;
}

export function ExportButton({ href, label = "Exporter CSV" }: ExportButtonProps) {
  return (
    <a
      href={href}
      download
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
    >
      <Download className="size-4" />
      {label}
    </a>
  );
}
