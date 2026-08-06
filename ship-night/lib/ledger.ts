import { Account, SEED_ACCOUNTS } from "./accounts";
import { ourFee, squareFee } from "./fees";

// Module-level singleton; persists across API calls in `next dev`.
let accounts: Account[] = SEED_ACCOUNTS.map((a) => ({ ...a }));

function findAccount(id: string): Account {
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new Error(`Unknown account: ${id}`);
  return account;
}

export function payBill(
  customerId: string,
  merchantId: string,
  total: number,
  tip: number,
  tipRecipientId: string
): {
  merchantCredited: number;
  tipCredited: number;
  breakdown: { food: number; tip: number };
} {
  const customer = findAccount(customerId);
  if (customer.balance < total) throw new Error("Insufficient balance");

  const merchant = findAccount(merchantId);
  const tipRecipient = findAccount(tipRecipientId);
  const food = total - tip;

  customer.balance -= total;
  merchant.balance += food;
  tipRecipient.balance += tip;

  return { merchantCredited: food, tipCredited: tip, breakdown: { food, tip } };
}

export function spend(
  fromId: string,
  toId: string,
  amount: number
): {
  amount: number;
  ourFee: number;
  squareFee: number;
} {
  const from = findAccount(fromId);
  if (from.balance < amount) throw new Error("Insufficient balance");

  const to = findAccount(toId);
  from.balance -= amount;
  to.balance += amount;

  return { amount, ourFee: ourFee(), squareFee: squareFee(amount) };
}

export function cashOut(accountId: string): { cashHanded: number } {
  const account = findAccount(accountId);
  const cashHanded = account.balance;

  account.balance = 0;
  findAccount("agent").balance += cashHanded;

  return { cashHanded };
}

export function getState(): Account[] {
  return accounts.map((a) => ({ ...a }));
}

export function reset(): void {
  accounts = SEED_ACCOUNTS.map((a) => ({ ...a }));
}
