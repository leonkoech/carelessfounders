"use client";

import type { Account } from "@/lib/accounts";

type SimulateBarProps = {
  accounts: Account[];
  onSimulateTap: (uid: string) => void;
};

export default function SimulateBar({
  accounts,
  onSimulateTap,
}: SimulateBarProps) {
  const tappable = accounts.filter((account) => account.uid);

  return (
    <div className="rounded-2xl border border-dashed border-zinc-600 bg-zinc-950/60 p-5">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Simulate tap (no hardware needed)
      </p>
      <div className="flex flex-wrap gap-3">
        {tappable.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => onSimulateTap(account.uid!)}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98]"
          >
            Simulate: {account.name} taps
          </button>
        ))}
      </div>
    </div>
  );
}
