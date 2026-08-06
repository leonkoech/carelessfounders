"use client";

import { useState } from "react";

type SolanaPanelProps = {
  sig?: string | null;
  fallback?: boolean;
  loading?: boolean;
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
    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm uppercase tracking-wide text-zinc-500">Solana devnet settlement</div>
        <button
          onClick={handleSettle}
          disabled={loading}
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
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
            className="break-all font-mono text-sm text-emerald-600 underline"
          >
            {sig}
          </a>
          <div className="mt-1 text-xs text-zinc-500">
            {fallback ? "Showing confirmed fallback transaction" : "Settled live on Solana devnet"}
          </div>
        </div>
      )}
    </div>
  );
}
