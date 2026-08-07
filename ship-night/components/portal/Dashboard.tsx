"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AccountCard from "@/components/AccountCard";
import FeeLine from "@/components/FeeLine";
import PortalHeader from "@/components/portal/PortalHeader";
import SimulateBar from "@/components/SimulateBar";
import SplitAnimation from "@/components/SplitAnimation";
import Terminal, { type TerminalMode } from "@/components/Terminal";
import {
  DEMO_BILL_TOTAL,
  DEMO_SPEND,
  DEMO_TIP,
  UID_MAP,
  type Account,
} from "@/lib/accounts";
import { cashOut, getState, payBill, spend } from "@/lib/ledger";
import { connectTapBridge, simulateTap } from "@/lib/tapSource";

type SplitPayload = {
  total: number;
  merchantAmount: number;
  tipAmount: number;
};

type FeePayload = {
  ourFee: number;
  squareFee: number;
  amount: number;
};

export default function Dashboard() {
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
  const [splitPayload, setSplitPayload] = useState<SplitPayload | null>(null);
  const [feePayload, setFeePayload] = useState<FeePayload | null>(null);

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
      setSplitPayload(null);

      try {
        if (mode === "charge") {
          if (accountId !== "customer") {
            setMessage("Charge Bill: tap the Customer card.");
            return;
          }

          const result = payBill(
            "customer",
            "restaurant",
            total,
            tip,
            "maria",
          );
          refreshAccounts();
          flashAccounts(["customer", "restaurant", "maria"]);
          setFeePayload(null);
          setSplitPayload({
            total,
            merchantAmount: result.merchantCredited,
            tipAmount: result.tipCredited,
          });
        } else if (mode === "spend") {
          if (accountId !== "maria") {
            setMessage("Spend: tap Maria's card.");
            return;
          }

          const result = spend("maria", "tacostand", amount);
          refreshAccounts();
          flashAccounts(["maria", "tacostand"]);
          setFeePayload({
            ourFee: result.ourFee,
            squareFee: result.squareFee,
            amount: result.amount,
          });
        } else {
          if (accountId !== "maria") {
            setMessage("Cash Out: tap Maria's card.");
            return;
          }

          cashOut("maria");
          refreshAccounts();
          flashAccounts(["maria", "agent"]);
          setFeePayload(null);
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

  const clearSplit = useCallback(() => setSplitPayload(null), []);

  const onSimulateTap = useCallback(
    (uid: string) => simulateTap(uid, handleTap),
    [handleTap],
  );

  useEffect(() => {
    const bridge = connectTapBridge(handleTap);
    return () => bridge.close();
  }, [handleTap]);

  return (
    <div className="min-h-full flex-1 bg-zinc-950 text-white">
      <PortalHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Loop · Portal
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Tap-to-pay demo dashboard
          </h1>
          <p className="max-w-2xl text-zinc-400">
            Simulate card taps — tip split animation and fee comparison on
            screen.
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
              setFeePayload(null);
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
