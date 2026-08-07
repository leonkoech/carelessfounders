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
      className={`rounded-2xl p-5 transition-all duration-300 ${
        highlight || changed
          ? "ring-2 ring-[#ff2f00] bg-[#ff2f00]/5 shadow-lg shadow-orange-500/10"
          : "bg-white ring-1 ring-black/5 shadow-sm"
      }`}
    >
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        {account.role}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-[#121111]">{account.name}</h3>
      <p
        className={`mt-4 truncate font-mono text-2xl font-bold tabular-nums sm:text-3xl xl:text-2xl 2xl:text-3xl ${
          changed ? "text-[#ff2f00]" : "text-[#121111]"
        }`}
      >
        {formatMoney(displayBalance)}
      </p>
    </div>
  );
}
