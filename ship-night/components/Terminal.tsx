"use client";

import type { TerminalMode } from "@/lib/tapSource";

const MODES: { value: TerminalMode; label: string }[] = [
  { value: "charge", label: "Charge (bill + tip)" },
  { value: "spend", label: "Spend in-network" },
  { value: "cashout", label: "Cash out" },
];

export function Terminal({
  mode,
  onModeChange,
  waiting,
}: {
  mode: TerminalMode;
  onModeChange: (m: TerminalMode) => void;
  waiting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="text-sm uppercase tracking-wide text-zinc-500">Terminal</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mode === m.value
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="mt-4 text-2xl font-semibold">{waiting ? "Waiting for tap…" : "Ready"}</div>
    </div>
  );
}
