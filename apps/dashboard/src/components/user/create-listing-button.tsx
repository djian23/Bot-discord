"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

interface ListingForm {
  title: string;
  eventName: string;
  date: string;
  category: string;
  quantity: string;
  priceEach: string;
  imageUrl: string;
  channelId: string;
}

const EMPTY_FORM: ListingForm = {
  title: "",
  eventName: "",
  date: "",
  category: "",
  quantity: "",
  priceEach: "",
  imageUrl: "",
  channelId: "",
};

export function CreateListingButton({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof ListingForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/my/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: form.title,
          eventName: form.eventName || undefined,
          date: form.date || undefined,
          category: form.category || undefined,
          quantity: form.quantity,
          priceEach: form.priceEach ? parseFloat(form.priceEach) : undefined,
          imageUrl: form.imageUrl || undefined,
          channelId: form.channelId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur");
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Plus className="size-4" />
        Nouveau listing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-discord-darker border border-white/10 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Nouveau Listing</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Field label="Titre *" required>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="WTS PSG CAT 1 DUO"
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Événement">
                  <input
                    type="text"
                    value={form.eventName}
                    onChange={(e) => setField("eventName", e.target.value)}
                    placeholder="PSG - OL"
                    className={inputCls}
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    placeholder="15 juin 2025"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Catégorie">
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    placeholder="CAT 1"
                    className={inputCls}
                  />
                </Field>
                <Field label="Quantité *" required>
                  <input
                    required
                    type="text"
                    value={form.quantity}
                    onChange={(e) => setField("quantity", e.target.value)}
                    placeholder="DUO, 4X, SINGLE…"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prix unitaire (€)">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.priceEach}
                    onChange={(e) => setField("priceEach", e.target.value)}
                    placeholder="320"
                    className={inputCls}
                  />
                </Field>
                <Field label="Discord Channel ID">
                  <input
                    type="text"
                    value={form.channelId}
                    onChange={(e) => setField("channelId", e.target.value)}
                    placeholder="123456789"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Image URL">
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Field>

              {error && (
                <p className="text-discord-red text-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? "Création…" : "Créer le listing"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white/60 text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">
        {label}
        {required && <span className="text-discord-red ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple";
