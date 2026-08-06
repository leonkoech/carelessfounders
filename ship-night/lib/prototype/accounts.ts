/**
 * Phase 2 prototype — self-contained mock data.
 * Swap to `@/lib/accounts` when Phase 1 lands.
 */

export type Account = {
  id: string;
  name: string;
  role: "customer" | "merchant" | "worker" | "agent" | string;
  balance: number;
  uid?: string;
};

export const SEED_ACCOUNTS: Account[] = [
  {
    id: "customer",
    name: "Customer",
    role: "customer",
    balance: 1000,
    uid: "CUSTOMER_CARD",
  },
  {
    id: "restaurant",
    name: "The Restaurant",
    role: "merchant",
    balance: 0,
  },
  {
    id: "maria",
    name: "Maria (server)",
    role: "worker",
    balance: 0,
    uid: "MARIA_CARD",
  },
  {
    id: "tacostand",
    name: "Taco Stand",
    role: "merchant",
    balance: 0,
  },
  {
    id: "agent",
    name: "Cash Agent",
    role: "agent",
    balance: 5000,
  },
];

export const UID_MAP: Record<string, string> = {
  CUSTOMER_CARD: "customer",
  MARIA_CARD: "maria",
};

export const OUR_FEE = 0.01;
export const DEMO_BILL_TOTAL = 250;
export const DEMO_TIP = 50;
export const DEMO_SPEND = 40;
