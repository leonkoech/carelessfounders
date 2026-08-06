"use client";

import { useEffect, useState } from "react";
import type { Account } from "@/lib/accounts";
import type { TerminalMode } from "@/lib/tapSource";
import { AccountCard } from "@/components/AccountCard";
import { FeeLine } from "@/components/FeeLine";
import { SimulateBar } from "@/components/SimulateBar";
import { SolanaPanel } from "@/components/SolanaPanel";
import { SplitAnimation } from "@/components/SplitAnimation";
import { Terminal } from "@/components/Terminal";

type TapResult =
  | { kind: "charge"; total: number; food: number; tip: number }
  | { kind: "spend"; amount: number; ourFee: number; squareFee: number }
  | { kind: "cashout"; cashHanded: number };

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mode, setMode] = useState<TerminalMode>("charge");
  const [waiting, setWaiting] = useState(false);
  const [lastResult, setLastResult] = useState<TapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts));
  }, []);

  async function handleTap(uid: string) {
    setWaiting(true);
    setError(null);
    try {
      const res = await fetch("/api/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, mode }),
      });
      const data = await res.json();
      setAccounts(data.accounts);

      if (!data.ok) {
        setError(data.reason ?? "Tap failed");
      } else if (mode === "charge") {
        setLastResult({
          kind: "charge",
          food: data.result.breakdown.food,
          tip: data.result.breakdown.tip,
          total: data.result.breakdown.food + data.result.breakdown.tip,
        });
      } else if (mode === "spend") {
        setLastResult({
          kind: "spend",
          amount: data.result.amount,
          ourFee: data.result.ourFee,
          squareFee: data.result.squareFee,
        });
      } else if (mode === "cashout") {
        setLastResult({ kind: "cashout", cashHanded: data.result.cashHanded });
      }
    } catch {
      setError("Network error");
    } finally {
      setWaiting(false);
    }
  }

  async function handleReset() {
    const res = await fetch("/api/reset", { method: "POST" });
    const data = await res.json();
    setAccounts(data.accounts);
    setLastResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loop — tap-payment demo</h1>
        <button
          onClick={handleReset}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Reset
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <AccountCard key={a.id} account={a} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Terminal mode={mode} onModeChange={setMode} waiting={waiting} />
        <SimulateBar accounts={accounts} onTap={handleTap} />
      </section>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {lastResult?.kind === "charge" && (
        <SplitAnimation total={lastResult.total} food={lastResult.food} tip={lastResult.tip} />
      )}
      {lastResult?.kind === "spend" && (
        <FeeLine ourFee={lastResult.ourFee} squareFee={lastResult.squareFee} />
      )}
      {lastResult?.kind === "cashout" && (
        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          Cash handed: <span className="font-bold">${lastResult.cashHanded.toFixed(2)}</span>
        </div>
      )}

      <SolanaPanel />
    </div>
  );
}
