"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccountCard from "@/components/AccountCard";
import FeeLine from "@/components/FeeLine";
import SimulateBar from "@/components/SimulateBar";
import { SolanaPanel } from "@/components/SolanaPanel";
import SplitAnimation from "@/components/SplitAnimation";
import Terminal from "@/components/Terminal";
import { DEMO_BILL_TOTAL, DEMO_SPEND, DEMO_TIP, type Account, type TerminalMode } from "@/lib/accounts";
import {
  setTerminalState,
  subscribeAccounts,
  subscribeTerminal,
  type TerminalState,
} from "@/lib/firestoreLedger";
import { simulateTap } from "@/lib/tapSource";

type SplitPayload = { total: number; merchantAmount: number; tipAmount: number };
type FeePayload = { ourFee: number; squareFee: number; amount: number };

const DEFAULT_TERMINAL: TerminalState = {
  mode: "charge",
  total: DEMO_BILL_TOTAL,
  tip: DEMO_TIP,
  amount: DEMO_SPEND,
};

function reasonToMessage(reason: string | undefined, mode: TerminalMode): string {
  if (reason === "unknown_uid") return "Unknown card — tap a registered demo card.";
  if (reason === "wrong_card") {
    if (mode === "charge") return "Charge Bill: tap the Customer card.";
    if (mode === "spend") return "Spend: tap Maria's card.";
    return "Cash Out: tap Maria's card.";
  }
  return reason ?? "Transaction failed.";
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [previousBalances, setPreviousBalances] = useState<Record<string, number>>({});
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [terminal, setTerminal] = useState<TerminalState>(DEFAULT_TERMINAL);
  const [waiting, setWaiting] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [splitPayload, setSplitPayload] = useState<SplitPayload | null>(null);
  const [feePayload, setFeePayload] = useState<FeePayload | null>(null);

  const accountsRef = useRef<Account[]>(accounts);

  useEffect(() => {
    const unsubAccounts = subscribeAccounts((next) => {
      const prior = Object.fromEntries(accountsRef.current.map((a) => [a.id, a.balance]));
      setPreviousBalances(prior);
      setAccounts(next);
      accountsRef.current = next;
    });
    const unsubTerminal = subscribeTerminal((state) => setTerminal(state));

    return () => {
      unsubAccounts();
      unsubTerminal();
    };
  }, []);

  const flashAccounts = useCallback((ids: string[]) => {
    setHighlightIds(ids);
    window.setTimeout(() => setHighlightIds([]), 700);
  }, []);

  const handleTap = useCallback(
    async (uid: string) => {
      setMessage(null);
      setSplitPayload(null);

      const res = await fetch("/api/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, source: "sim" }),
      });
      const data = await res.json();

      if (!data.ok) {
        setMessage(reasonToMessage(data.reason, data.mode ?? terminal.mode));
        return;
      }

      if (data.mode === "charge") {
        flashAccounts(["customer", "restaurant", "maria"]);
        setFeePayload(null);
        setSplitPayload({
          total: data.result.breakdown.food + data.result.breakdown.tip,
          merchantAmount: data.result.breakdown.food,
          tipAmount: data.result.breakdown.tip,
        });
      } else if (data.mode === "spend") {
        flashAccounts(["maria", "tacostand"]);
        setFeePayload({
          ourFee: data.result.ourFee,
          squareFee: data.result.squareFee,
          amount: data.result.amount,
        });
      } else {
        flashAccounts(["maria", "agent"]);
        setFeePayload(null);
      }

      setWaiting(false);
      window.setTimeout(() => setWaiting(true), 400);
    },
    [terminal.mode, flashAccounts]
  );

  const clearSplit = useCallback(() => setSplitPayload(null), []);

  const onSimulateTap = useCallback(
    (uid: string) => simulateTap(uid, handleTap),
    [handleTap]
  );

  function updateTerminal(patch: Partial<TerminalState>) {
    const next = { ...terminal, ...patch };
    setTerminal(next);
    setWaiting(true);
    void setTerminalState(next);
  }

  async function handleReset() {
    await fetch("/api/reset", { method: "POST" });
    setMessage(null);
    setSplitPayload(null);
    setFeePayload(null);
    setWaiting(true);
  }

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Loop · Ship Night
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Tap-to-pay demo dashboard</h1>
            <p className="max-w-2xl text-zinc-400">
              Simulate card taps to move money — dollars enter once and circulate at ~$0.01 a hop.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            Reset
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              previousBalance={previousBalances[account.id]}
              highlight={highlightIds.includes(account.id)}
            />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Terminal
            mode={terminal.mode}
            onModeChange={(nextMode) => {
              setMessage(null);
              setFeePayload(null);
              updateTerminal({ mode: nextMode });
            }}
            total={terminal.total}
            tip={terminal.tip}
            amount={terminal.amount}
            onTotalChange={(value) => updateTerminal({ total: value })}
            onTipChange={(value) => updateTerminal({ tip: value })}
            onAmountChange={(value) => updateTerminal({ amount: value })}
            waiting={waiting}
          />

          <div className="space-y-4">
            {feePayload && (
              <FeeLine
                ourFee={feePayload.ourFee}
                squareFee={feePayload.squareFee}
                amount={feePayload.amount}
              />
            )}

            {message && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100">
                {message}
              </div>
            )}
          </div>
        </section>

        <SimulateBar accounts={accounts} onSimulateTap={onSimulateTap} />

        <SolanaPanel />
      </main>

      {splitPayload && (
        <SplitAnimation
          total={splitPayload.total}
          merchantAmount={splitPayload.merchantAmount}
          tipAmount={splitPayload.tipAmount}
          onComplete={clearSplit}
        />
      )}
    </div>
  );
}
