"use client";

import { useState } from "react";
import { Pencil, RefreshCw, CheckCircle, Archive, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  date?: string | null;
  category?: string | null;
  quantity: string;
  priceEach?: number | null;
  image?: string | null;
  discordChannelId?: string | null;
  status: string;
}

interface Props {
  listing: Listing;
}

const inputCls =
  "w-full bg-discord-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-discord-blurple";

export function ListingActions({ listing }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    title: listing.title,
    date: listing.date ?? "",
    category: listing.category ?? "",
    quantity: listing.quantity,
    priceEach: listing.priceEach?.toString() ?? "",
    imageUrl: listing.image ?? "",
    channelId: listing.discordChannelId ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/my/listings/${listing.id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action !== "delete" ? JSON.stringify({ action, ...extra }) : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur");
      }
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    await doAction("edit", {
      title: form.title,
      date: form.date || undefined,
      category: form.category || undefined,
      quantity: form.quantity,
      priceEach: form.priceEach ? parseFloat(form.priceEach) : undefined,
      imageUrl: form.image || undefined,
      channelId: form.channelId || undefined,
    });
    setEditOpen(false);
  }

  const canRepublish = ["PUBLISHED", "SOLD", "EXPIRED"].includes(listing.status);

  return (
    <>
      <div className="flex items-center gap-1">
        <ActionBtn
          title="Modifier"
          onClick={() => setEditOpen(true)}
          disabled={loading}
        >
          <Pencil className="size-3.5" />
        </ActionBtn>
        {canRepublish && (
          <ActionBtn
            title="Republier"
            onClick={() => doAction("republish")}
            disabled={loading}
          >
            <RefreshCw className="size-3.5" />
          </ActionBtn>
        )}
        {listing.status !== "SOLD" && (
          <ActionBtn
            title="Marquer vendu"
            onClick={() => doAction("sold")}
            disabled={loading}
          >
            <CheckCircle className="size-3.5" />
          </ActionBtn>
        )}
        {listing.status !== "ARCHIVED" && (
          <ActionBtn
            title="Archiver"
            onClick={() => doAction("archive")}
            disabled={loading}
          >
            <Archive className="size-3.5" />
          </ActionBtn>
        )}
        <ActionBtn
          title="Supprimer"
          onClick={() => {
            if (confirm("Supprimer ce listing ?")) doAction("delete");
          }}
          disabled={loading}
          danger
        >
          <Trash2 className="size-3.5" />
        </ActionBtn>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-discord-darker border border-white/10 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Modifier le listing</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Titre *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Date</label>
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Quantité *</label>
                  <input
                    required
                    type="text"
                    value={form.quantity}
                    onChange={(e) => setField("quantity", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Prix unitaire (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.priceEach}
                    onChange={(e) => setField("priceEach", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Discord Channel ID</label>
                <input
                  type="text"
                  value={form.channelId}
                  onChange={(e) => setField("channelId", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  className={inputCls}
                />
              </div>

              {error && <p className="text-discord-red text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-discord-blurple hover:bg-discord-blurple/80 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? "Sauvegarde…" : "Sauvegarder"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
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

function ActionBtn({
  children,
  title,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded-md transition-colors disabled:opacity-40",
        danger
          ? "text-discord-red/60 hover:text-discord-red hover:bg-discord-red/10"
          : "text-white/40 hover:text-white hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}
