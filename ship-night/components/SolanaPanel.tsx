"use client";

import { useState } from "react";

type SolanaPanelProps = {
  onSettle?: () => void;
};

const EXPLORER_BASE = "https://explorer.solana.com/tx";

export function SolanaPanel({ onSettle }: SolanaPanelProps) {
  const [sig, setSig] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSettle() {
    onSettle?.();
    setLoading(true);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setSig(data.sig || null);
      setFallback(Boolean(data.fallback));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/90 p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          Solana devnet settlement
        </p>
        <button
          type="button"
          onClick={handleSettle}
          disabled={loading}
          className="shrink-0 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Settling…" : "Settle on-chain"}
        </button>
      </div>

      {sig && (
        <div className="mt-4">
          <a
            href={`${EXPLORER_BASE}/${sig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-sm text-emerald-400 underline"
          >
            {sig}
          </a>
          <p className="mt-1 text-xs text-zinc-500">
            {fallback ? "Showing confirmed fallback transaction" : "Settled live on Solana devnet"}
          </p>
        </div>
      )}
    </div>
  );
}
