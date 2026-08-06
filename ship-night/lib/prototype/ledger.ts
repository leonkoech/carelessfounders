/**
 * Phase 2 prototype ledger — in-memory mock matching Build/contracts.md.
 * Replace imports in app/page.tsx with `@/lib/ledger` when Phase 1 merges.
 */

import { Account, SEED_ACCOUNTS } from "./accounts";
import { ourFee, squareFee } from "./fees";

type LedgerAccount = Account & { balance: number };

let accounts: LedgerAccount[] = SEED_ACCOUNTS.map((a) => ({ ...a }));

function getAccount(id: string): LedgerAccount {
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new Error(`Unknown account: ${id}`);
  return account;
}

function assertBalance(account: LedgerAccount, amount: number): void {
  if (account.balance < amount) {
    throw new Error(
      `${account.name} has insufficient balance ($${account.balance.toFixed(2)})`,
    );
  }
}

export function payBill(
  customerId: string,
  merchantId: string,
  total: number,
  tip: number,
  tipRecipientId: string,
) {
  const customer = getAccount(customerId);
  const merchant = getAccount(merchantId);
  const tipRecipient = getAccount(tipRecipientId);

  assertBalance(customer, total);

  const food = total - tip;
  customer.balance -= total;
  merchant.balance += food;
  tipRecipient.balance += tip;

  return {
    merchantCredited: food,
    tipCredited: tip,
    breakdown: { food, tip },
  };
}

export function spend(fromId: string, toId: string, amount: number) {
  const from = getAccount(fromId);
  const to = getAccount(toId);

  assertBalance(from, amount);

  from.balance -= amount;
  to.balance += amount;

  return {
    amount,
    ourFee: ourFee(amount),
    squareFee: squareFee(amount),
  };
}

export function cashOut(accountId: string) {
  const worker = getAccount(accountId);
  const agent = getAccount("agent");
  const cashHanded = worker.balance;

  agent.balance += cashHanded;
  worker.balance = 0;

  return { cashHanded };
}

export function getState(): Account[] {
  return accounts.map(({ id, name, role, balance, uid }) => ({
    id,
    name,
    role,
    balance,
    uid,
  }));
}

export function reset(): void {
  accounts = SEED_ACCOUNTS.map((a) => ({ ...a }));
}
