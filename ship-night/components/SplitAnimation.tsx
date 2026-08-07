"use client";

import { useEffect, useState } from "react";

type SplitAnimationProps = {
  total: number;
  merchantAmount: number;
  tipAmount: number;
  merchantLabel?: string;
  tipLabel?: string;
  onComplete?: () => void;
};

function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function SplitAnimation({
  total,
  merchantAmount,
  tipAmount,
  merchantLabel = "Restaurant",
  tipLabel = "Maria",
  onComplete,
}: SplitAnimationProps) {
  const [phase, setPhase] = useState<"enter" | "split" | "exit">("enter");

  useEffect(() => {
    const splitTimer = window.setTimeout(() => setPhase("split"), 120);
    const exitTimer = window.setTimeout(() => setPhase("exit"), 900);
    const completeTimer = window.setTimeout(() => onComplete?.(), 1000);

    return () => {
      window.clearTimeout(splitTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [total, merchantAmount, tipAmount, onComplete]);

  if (phase === "exit") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#121111]/40 backdrop-blur-sm">
      <div className="relative flex min-h-[220px] w-full max-w-3xl items-center justify-center px-6">
        <div
          className={`absolute rounded-2xl bg-white px-8 py-6 text-6xl font-black text-[#121111] shadow-xl ring-1 ring-black/5 transition-all duration-500 sm:text-7xl ${
            phase === "split"
              ? "scale-75 opacity-0"
              : "scale-100 opacity-100"
          }`}
        >
          {formatMoney(total)}
        </div>

        <div
          className={`absolute flex flex-col items-center rounded-2xl bg-white px-8 py-6 shadow-xl ring-1 ring-black/5 transition-all duration-500 ${
            phase === "split"
              ? "-translate-x-40 opacity-100"
              : "translate-x-0 opacity-0"
          }`}
        >
          <span className="text-5xl font-black text-[#121111] sm:text-6xl">
            {formatMoney(merchantAmount)}
          </span>
          <span className="mt-2 text-xl font-semibold text-zinc-600">
            → {merchantLabel}
          </span>
        </div>

        <div
          className={`absolute flex flex-col items-center rounded-2xl bg-white px-8 py-6 shadow-xl ring-1 ring-black/5 transition-all duration-500 ${
            phase === "split"
              ? "translate-x-40 opacity-100"
              : "translate-x-0 opacity-0"
          }`}
        >
          <span className="text-5xl font-black text-[#ff2f00] sm:text-6xl">
            {formatMoney(tipAmount)}
          </span>
          <span className="mt-2 text-xl font-semibold text-zinc-600">
            → {tipLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
