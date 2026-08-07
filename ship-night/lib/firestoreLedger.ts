import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  DEMO_BILL_TOTAL,
  DEMO_SPEND,
  DEMO_TIP,
  SEED_ACCOUNTS,
  type Account,
  type TerminalMode,
} from "./accounts";
import { ourFee, squareFee } from "./fees";

// Mirrors the business rules tested in lib/ledger.test.ts against lib/ledger.ts —
// keep both in sync if the money math ever changes.

const ACCOUNTS_COLLECTION = "accounts";
const TERMINAL_DOC_PATH = ["terminal", "state"] as const;

export type TerminalState = {
  mode: TerminalMode;
  total: number;
  tip: number;
  amount: number;
};

const DEFAULT_TERMINAL_STATE: TerminalState = {
  mode: "charge",
  total: DEMO_BILL_TOTAL,
  tip: DEMO_TIP,
  amount: DEMO_SPEND,
};

function accountDoc(id: string) {
  return doc(db, ACCOUNTS_COLLECTION, id);
}

function terminalDoc() {
  return doc(db, ...TERMINAL_DOC_PATH);
}

export function subscribeAccounts(onChange: (accounts: Account[]) => void): Unsubscribe {
  return onSnapshot(collection(db, ACCOUNTS_COLLECTION), (snap) => {
    const accounts = snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<Account, "id">) }) as Account
    );
    onChange(accounts);
  });
}

export function subscribeTerminal(onChange: (state: TerminalState) => void): Unsubscribe {
  return onSnapshot(terminalDoc(), (snap) => {
    onChange(snap.exists() ? (snap.data() as TerminalState) : DEFAULT_TERMINAL_STATE);
  });
}

export async function setTerminalState(state: TerminalState): Promise<void> {
  await setDoc(terminalDoc(), state);
}

export async function getTerminalState(): Promise<TerminalState> {
  const snap = await getDoc(terminalDoc());
  return snap.exists() ? (snap.data() as TerminalState) : DEFAULT_TERMINAL_STATE;
}

export async function seedIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, ACCOUNTS_COLLECTION));
  if (!snap.empty) return;
  await resetAccounts();
}

export async function resetAccounts(): Promise<void> {
  await runTransaction(db, async (tx) => {
    for (const { id, ...rest } of SEED_ACCOUNTS) {
      tx.set(accountDoc(id), rest);
    }
  });
  await setTerminalState(DEFAULT_TERMINAL_STATE);
}

export async function applyPayBill(
  customerId: string,
  merchantId: string,
  total: number,
  tip: number,
  tipRecipientId: string
): Promise<{
  merchantCredited: number;
  tipCredited: number;
  breakdown: { food: number; tip: number };
}> {
  return runTransaction(db, async (tx) => {
    const customerRef = accountDoc(customerId);
    const merchantRef = accountDoc(merchantId);
    const tipRef = accountDoc(tipRecipientId);

    const [customerSnap, merchantSnap, tipSnap] = await Promise.all([
      tx.get(customerRef),
      tx.get(merchantRef),
      tx.get(tipRef),
    ]);

    if (!customerSnap.exists()) throw new Error(`Account not found: ${customerId}`);
    if (!merchantSnap.exists()) throw new Error(`Account not found: ${merchantId}`);
    if (!tipSnap.exists()) throw new Error(`Account not found: ${tipRecipientId}`);

    const customerBalance = customerSnap.data().balance as number;
    if (customerBalance < total) throw new Error("Insufficient balance");

    const food = total - tip;
    if (food < 0) throw new Error("Tip cannot exceed total");

    tx.update(customerRef, { balance: customerBalance - total });
    tx.update(merchantRef, { balance: (merchantSnap.data().balance as number) + food });
    tx.update(tipRef, { balance: (tipSnap.data().balance as number) + tip });

    return { merchantCredited: food, tipCredited: tip, breakdown: { food, tip } };
  });
}

export async function applySpend(
  fromId: string,
  toId: string,
  amount: number
): Promise<{ amount: number; ourFee: number; squareFee: number }> {
  return runTransaction(db, async (tx) => {
    const fromRef = accountDoc(fromId);
    const toRef = accountDoc(toId);
    const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);

    if (!fromSnap.exists()) throw new Error(`Account not found: ${fromId}`);
    if (!toSnap.exists()) throw new Error(`Account not found: ${toId}`);

    const fromBalance = fromSnap.data().balance as number;
    if (amount < 0) throw new Error("Amount must be non-negative");
    if (fromBalance < amount) throw new Error("Insufficient balance");

    tx.update(fromRef, { balance: fromBalance - amount });
    tx.update(toRef, { balance: (toSnap.data().balance as number) + amount });

    return { amount, ourFee: ourFee(amount), squareFee: squareFee(amount) };
  });
}

export async function applyCashOut(accountId: string): Promise<{ cashHanded: number }> {
  return runTransaction(db, async (tx) => {
    const workerRef = accountDoc(accountId);
    const agentRef = accountDoc("agent");
    const [workerSnap, agentSnap] = await Promise.all([tx.get(workerRef), tx.get(agentRef)]);

    if (!workerSnap.exists()) throw new Error(`Account not found: ${accountId}`);
    if (!agentSnap.exists()) throw new Error(`Account not found: agent`);

    const cashHanded = workerSnap.data().balance as number;
    tx.update(workerRef, { balance: 0 });
    tx.update(agentRef, { balance: (agentSnap.data().balance as number) + cashHanded });

    return { cashHanded };
  });
}
