import { type Account, SEED_ACCOUNTS } from "./accounts";
import { ourFee, squareFee } from "./fees";

function cloneAccounts(accounts: Account[]): Account[] {
  return accounts.map((a) => ({ ...a }));
}

let accounts: Account[] = cloneAccounts(SEED_ACCOUNTS);

function getAccount(id: string): Account {
  const account = accounts.find((a) => a.id === id);
  if (!account) {
    throw new Error(`Account not found: ${id}`);
  }
  return account;
}

function requireBalance(account: Account, amount: number): void {
  if (amount < 0) {
    throw new Error("Amount must be non-negative");
  }
  if (account.balance < amount) {
    throw new Error("Insufficient balance");
  }
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
  const customer = getAccount(customerId);
  const merchant = getAccount(merchantId);
  const tipRecipient = getAccount(tipRecipientId);

  requireBalance(customer, total);

  const food = total - tip;
  if (food < 0) {
    throw new Error("Tip cannot exceed total");
  }

  customer.balance -= total;
  merchant.balance += food;
  tipRecipient.balance += tip;

  return {
    merchantCredited: food,
    tipCredited: tip,
    breakdown: { food, tip },
  };
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
  const from = getAccount(fromId);
  const to = getAccount(toId);

  requireBalance(from, amount);

  from.balance -= amount;
  to.balance += amount;

  return {
    amount,
    ourFee: ourFee(amount),
    squareFee: squareFee(amount),
  };
}

export function cashOut(accountId: string): { cashHanded: number } {
  const worker = getAccount(accountId);
  const agent = getAccount("agent");

  const cashHanded = worker.balance;
  agent.balance += cashHanded;
  worker.balance = 0;

  return { cashHanded };
}

export function getState(): Account[] {
  return cloneAccounts(accounts);
}

export function reset(): void {
  accounts = cloneAccounts(SEED_ACCOUNTS);
}
