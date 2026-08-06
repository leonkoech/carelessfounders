"use client";

import { useCallback, useRef, useState } from "react";
import AccountCard from "@/components/AccountCard";
import SimulateBar from "@/components/SimulateBar";
import Terminal, { type TerminalMode } from "@/components/Terminal";
// Prototype: swap to `@/lib/accounts` + `@/lib/ledger` when Phase 1 merges
import {
  DEMO_BILL_TOTAL,
  DEMO_SPEND,
  DEMO_TIP,
  UID_MAP,
  cashOut,
  getState,
  payBill,
  spend,
  type Account,
} from "@/lib/prototype";
import { simulateTap } from "@/lib/tapSource";

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>(() => getState());
  const [previousBalances, setPreviousBalances] = useState<
    Record<string, number>
  >({});
  const [mode, setMode] = useState<TerminalMode>("charge");
  const [total, setTotal] = useState(DEMO_BILL_TOTAL);
  const [tip, setTip] = useState(DEMO_TIP);
  const [amount, setAmount] = useState(DEMO_SPEND);
  const [waiting, setWaiting] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);

  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  const refreshAccounts = useCallback(() => {
    const prior = Object.fromEntries(
      accountsRef.current.map((a) => [a.id, a.balance]),
    );
    const next = getState();
    setPreviousBalances(prior);
    setAccounts(next);
    accountsRef.current = next;
  }, []);

  const flashAccounts = useCallback((ids: string[]) => {
    setHighlightIds(ids);
    window.setTimeout(() => setHighlightIds([]), 700);
  }, []);

  const handleTap = useCallback(
    (uid: string) => {
      const accountId = UID_MAP[uid];
      if (!accountId) {
        setMessage("Unknown card — tap a registered demo card.");
        return;
      }

      setMessage(null);

      try {
        if (mode === "charge") {
          if (accountId !== "customer") {
            setMessage("Charge Bill: tap the Customer card.");
            return;
          }
          payBill("customer", "restaurant", total, tip, "maria");
          refreshAccounts();
          flashAccounts(["customer", "restaurant", "maria"]);
        } else if (mode === "spend") {
          if (accountId !== "maria") {
            setMessage("Spend: tap Maria's card.");
            return;
          }
          spend("maria", "tacostand", amount);
          refreshAccounts();
          flashAccounts(["maria", "tacostand"]);
        } else {
          if (accountId !== "maria") {
            setMessage("Cash Out: tap Maria's card.");
            return;
          }
          cashOut("maria");
          refreshAccounts();
          flashAccounts(["maria", "agent"]);
        }

        setWaiting(false);
        window.setTimeout(() => setWaiting(true), 400);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Transaction failed.",
        );
      }
    },
    [amount, flashAccounts, mode, refreshAccounts, tip, total],
  );

  const onSimulateTap = useCallback(
    (uid: string) => simulateTap(uid, handleTap),
    [handleTap],
  );

  return (
    <div className="min-h-full bg-zinc-950 text-white">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <div className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
            Prototype · mock ledger (Phase 2)
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Loop · Ship Night
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Tap-to-pay demo dashboard
          </h1>
          <p className="max-w-2xl text-zinc-400">
            Simulate card taps to move money — no hardware, no Phase 1 dependency.
          </p>
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
            mode={mode}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              setMessage(null);
              setWaiting(true);
            }}
            total={total}
            tip={tip}
            amount={amount}
            onTotalChange={(value) => {
              setTotal(value);
              setWaiting(true);
            }}
            onTipChange={(value) => {
              setTip(value);
              setWaiting(true);
            }}
            onAmountChange={(value) => {
              setAmount(value);
              setWaiting(true);
            }}
            waiting={waiting}
          />

          {message && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100">
              {message}
            </div>
          )}
        </section>

        <SimulateBar accounts={accounts} onSimulateTap={onSimulateTap} />
      </main>
    </div>
  );
}
