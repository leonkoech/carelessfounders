/**
 * Server-side ledger backend switch.
 *
 * Firestore is the primary backend (shared/persistent team state). When the
 * NEXT_PUBLIC_FIREBASE_* env vars are absent — e.g. a teammate's machine
 * without .env.local — everything falls back to the in-memory Phase 1 ledger
 * so the demo never dies. Same /api/tap contract either way.
 */

import {
  DEMO_BILL_TOTAL,
  DEMO_SPEND,
  DEMO_TIP,
  type Account,
} from "./accounts";
import * as memoryLedger from "./ledger";
import type { TerminalState } from "./firestoreLedger";

export const hasFirestore = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
);

const DEFAULT_TERMINAL: TerminalState = {
  mode: "charge",
  total: DEMO_BILL_TOTAL,
  tip: DEMO_TIP,
  amount: DEMO_SPEND,
};

// Survives HMR reloads in `next dev`.
const globalState = globalThis as unknown as {
  __loopTerminal?: TerminalState;
};

function memTerminal(): TerminalState {
  globalState.__loopTerminal ??= { ...DEFAULT_TERMINAL };
  return globalState.__loopTerminal;
}

async function firestore() {
  return import("./firestoreLedger");
}

export async function getTerminal(): Promise<TerminalState> {
  if (hasFirestore) {
    const fs = await firestore();
    return fs.getTerminalState();
  }
  return memTerminal();
}

export async function setTerminal(state: TerminalState): Promise<void> {
  if (hasFirestore) {
    const fs = await firestore();
    await fs.setTerminalState(state);
    return;
  }
  globalState.__loopTerminal = state;
}

export async function getAccounts(): Promise<Account[]> {
  if (hasFirestore) {
    const fs = await firestore();
    await fs.seedIfEmpty();
    return new Promise((resolve) => {
      const unsub = fs.subscribeAccounts((accounts) => {
        unsub();
        resolve(accounts);
      });
    });
  }
  return memoryLedger.getState();
}

export async function seedIfEmpty(): Promise<void> {
  if (hasFirestore) {
    const fs = await firestore();
    await fs.seedIfEmpty();
  }
}

export async function payBill(
  customerId: string,
  merchantId: string,
  total: number,
  tip: number,
  tipRecipientId: string,
) {
  if (hasFirestore) {
    const fs = await firestore();
    return fs.applyPayBill(customerId, merchantId, total, tip, tipRecipientId);
  }
  return memoryLedger.payBill(customerId, merchantId, total, tip, tipRecipientId);
}

export async function spend(fromId: string, toId: string, amount: number) {
  if (hasFirestore) {
    const fs = await firestore();
    return fs.applySpend(fromId, toId, amount);
  }
  return memoryLedger.spend(fromId, toId, amount);
}

export async function cashOut(accountId: string) {
  if (hasFirestore) {
    const fs = await firestore();
    return fs.applyCashOut(accountId);
  }
  return memoryLedger.cashOut(accountId);
}

export async function reset(): Promise<void> {
  if (hasFirestore) {
    const fs = await firestore();
    await fs.resetAccounts();
    return;
  }
  memoryLedger.reset();
  globalState.__loopTerminal = { ...DEFAULT_TERMINAL };
}
