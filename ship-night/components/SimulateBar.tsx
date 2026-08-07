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
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Simulate tap (no hardware needed)
      </p>
      <div className="flex flex-wrap gap-3">
        {tappable.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => onSimulateTap(account.uid!)}
            className="rounded-full bg-[#ff2f00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e62a00] active:scale-[0.98]"
          >
            Simulate: {account.name} taps
          </button>
        ))}
      </div>
    </div>
  );
}
