"use client";

import { useEffect, useRef, useState } from "react";
import type { Account } from "@/lib/accounts";

export function AccountCard({ account }: { account: Account }) {
  const [flash, setFlash] = useState(false);
  const prevBalance = useRef(account.balance);

  useEffect(() => {
    if (prevBalance.current !== account.balance) {
      prevBalance.current = account.balance;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [account.balance]);

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition-colors duration-500 ${
        flash
          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="text-sm uppercase tracking-wide text-zinc-500">{account.role}</div>
      <div className="mt-1 text-lg font-medium">{account.name}</div>
      <div className="mt-4 text-4xl font-bold tabular-nums">${account.balance.toFixed(2)}</div>
    </div>
  );
}
