"use client";

import { useEffect, useRef, useState } from "react";
import type { Account } from "@/lib/accounts";

type AccountCardProps = {
  account: Account;
  previousBalance?: number;
  highlight?: boolean;
};

function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountCard({
  account,
  previousBalance,
  highlight = false,
}: AccountCardProps) {
  const [displayBalance, setDisplayBalance] = useState(account.balance);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = previousBalance ?? account.balance;
    const end = account.balance;

    if (start === end) {
      setDisplayBalance(end);
      return;
    }

    const duration = 500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(start + (end - start) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [account.balance, previousBalance]);

  const changed =
    previousBalance !== undefined && previousBalance !== account.balance;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 ${
        highlight || changed
          ? "border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20"
          : "border-zinc-700 bg-zinc-900/80"
      }`}
    >
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
        {account.role}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-white">{account.name}</h3>
      <p
        className={`mt-4 font-mono text-4xl font-bold tabular-nums sm:text-5xl ${
          changed ? "text-emerald-300" : "text-white"
        }`}
      >
        {formatMoney(displayBalance)}
      </p>
    </div>
  );
}
