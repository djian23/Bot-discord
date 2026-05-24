"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmbedTemplate {
  title?: string;
  mentionRoleId?: string;
  showSite?: boolean;
  showPrice?: boolean;
  showQuantity?: boolean;
  showPas?: boolean;
  showCategory?: boolean;
  showSection?: boolean;
  showCheckout?: boolean;
  showExpiration?: boolean;
  showImage?: boolean;
  footerText?: string;
}

interface EmbedConfigFormProps {
  eventId: string;
  embedColor: string;
  embedTemplate: EmbedTemplate;
}

const TOGGLE_FIELDS: { key: keyof EmbedTemplate; label: string }[] = [
  { key: "showSite",       label: "Site"        },
  { key: "showPrice",      label: "Prix"        },
  { key: "showQuantity",   label: "Quantité"    },
  { key: "showPas",        label: "PAS"         },
  { key: "showCategory",   label: "Catégorie"   },
  { key: "showSection",    label: "Section"     },
  { key: "showCheckout",   label: "Checkout"    },
  { key: "showExpiration", label: "Expiration"  },
  { key: "showImage",      label: "Image"       },
];

export function EmbedConfigForm({ eventId, embedColor, embedTemplate }: EmbedConfigFormProps) {
  const router = useRouter();
  const [color, setColor] = useState(embedColor);
  const [tpl, setTpl] = useState<EmbedTemplate>({
    showSite: true, showPrice: true, showQuantity: true, showPas: true,
    showCategory: true, showSection: true, showCheckout: true,
    showExpiration: true, showImage: true,
    ...embedTemplate,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof EmbedTemplate) {
    setTpl((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_embed", embedColor: color, embedTemplate: tpl }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Title template */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">
          Titre de l'embed{" "}
          <span className="text-white/30">
            (variables : {"{eventName}"} {"{site}"} {"{price}"} {"{quantity}"})
          </span>
        </label>
        <input
          type="text"
          value={tpl.title ?? ""}
          placeholder="🎫 Nouveau Cart — {eventName}"
          onChange={(e) => setTpl((p) => ({ ...p, title: e.target.value || undefined }))}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Couleur</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="size-9 rounded border border-white/10 bg-transparent cursor-pointer"
          />
          <span className="text-sm font-mono text-white/60">{color}</span>
        </div>
      </div>

      {/* Fields toggles */}
      <div>
        <label className="block text-xs text-white/50 mb-2">Champs affichés</label>
        <div className="flex flex-wrap gap-2">
          {TOGGLE_FIELDS.map(({ key, label }) => {
            const on = tpl[key] !== false;
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  on
                    ? "bg-discord-blurple text-white"
                    : "bg-white/5 text-white/40 line-through"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mention role */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">
          Mention rôle (ID Discord, optionnel)
        </label>
        <input
          type="text"
          value={tpl.mentionRoleId ?? ""}
          placeholder="ex: 123456789012345678"
          onChange={(e) => setTpl((p) => ({ ...p, mentionRoleId: e.target.value || undefined }))}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 font-mono focus:outline-none focus:border-discord-blurple"
        />
      </div>

      {/* Footer */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">
          Footer <span className="text-white/30">(variable : {"{cartId}"})</span>
        </label>
        <input
          type="text"
          value={tpl.footerText ?? ""}
          placeholder="Cart #{cartId}"
          onChange={(e) => setTpl((p) => ({ ...p, footerText: e.target.value || undefined }))}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {saved ? "Sauvegardé ✓" : "Sauvegarder"}
      </button>
    </div>
  );
}
