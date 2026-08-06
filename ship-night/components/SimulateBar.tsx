"use client";

import type { Account } from "@/lib/accounts";

export function SimulateBar({
  accounts,
  onTap,
}: {
  accounts: Account[];
  onTap: (uid: string) => void;
}) {
  const tappable = accounts.filter((a) => a.uid);

  return (
    <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="text-sm uppercase tracking-wide text-zinc-500">Simulate tap</div>
      <div className="mt-3 flex flex-wrap gap-3">
        {tappable.map((a) => (
          <button
            key={a.id}
            onClick={() => onTap(a.uid!)}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Tap {a.name}
          </button>
        ))}
      </div>
    </div>
  );
}
