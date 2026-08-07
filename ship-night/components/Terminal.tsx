"use client";

import type { TerminalMode } from "@/lib/accounts";

type TerminalProps = {
  mode: TerminalMode;
  onModeChange: (mode: TerminalMode) => void;
  total: number;
  tip: number;
  amount: number;
  onTotalChange: (value: number) => void;
  onTipChange: (value: number) => void;
  onAmountChange: (value: number) => void;
  waiting: boolean;
};

const MODES: { id: TerminalMode; label: string }[] = [
  { id: "charge", label: "Charge Bill" },
  { id: "spend", label: "Spend" },
  { id: "cashout", label: "Cash Out" },
];

export default function Terminal({
  mode,
  onModeChange,
  total,
  tip,
  amount,
  onTotalChange,
  onTipChange,
  onAmountChange,
  waiting,
}: TerminalProps) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/90 p-6">
      <div className="flex flex-wrap gap-2">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              mode === id
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {mode === "charge" && (
          <>
            <label className="block">
              <span className="text-sm text-zinc-400">Bill total</span>
              <input
                type="number"
                min={0}
                step={1}
                value={total}
                onChange={(event) => onTotalChange(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-950 px-4 py-3 text-2xl font-semibold text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-400">Tip</span>
              <input
                type="number"
                min={0}
                step={1}
                value={tip}
                onChange={(event) => onTipChange(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-950 px-4 py-3 text-2xl font-semibold text-white"
              />
            </label>
          </>
        )}

        {mode === "spend" && (
          <label className="block sm:col-span-2">
            <span className="text-sm text-zinc-400">Spend amount</span>
            <input
              type="number"
              min={0}
              step={1}
              value={amount}
              onChange={(event) => onAmountChange(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-950 px-4 py-3 text-2xl font-semibold text-white"
            />
          </label>
        )}

        {mode === "cashout" && (
          <p className="sm:col-span-2 text-lg text-zinc-300">
            Worker taps to cash out their full balance at the agent.
          </p>
        )}
      </div>

      <div
        className={`mt-6 rounded-xl px-4 py-3 text-center text-lg font-medium ${
          waiting
            ? "animate-pulse bg-amber-500/20 text-amber-200"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        {waiting ? "Waiting for tap…" : "Adjust amounts or mode to arm terminal"}
      </div>
    </div>
  );
}
