# Phase 1 — Ledger core

**Goal:** All money math works in a pure, testable in-memory ledger. No UI, no API routes, no hardware. Every downstream phase imports these modules unchanged.

| | |
|---|---|
| **Owner** | **Person A — Core / integrator** (see [`team-split.md`](team-split.md)) |
| **Depends on** | [Phase 0 — Project bootstrap](./00-setup.md) |
| **Estimated time** | 45–60 min |
| **Required** | Yes — **blocks Phases 2–4** |

---

## Files to create

| Path | Purpose |
|---|---|
| `lib/accounts.ts` | Account type, seed data, `UID_MAP`, demo constants |
| `lib/fees.ts` | `squareFee`, `ourFee` helpers |
| `lib/ledger.ts` | Module singleton: `payBill`, `spend`, `cashOut`, `getState` |
| `lib/ledger.test.ts` | Vitest proofs for bill split + spend fee math |

No other files in this phase. Do not touch `app/`, `components/`, or `bridge/`.

---

## Contracts (frozen — match [`contracts.md`](contracts.md))

### Account type & seed

```ts
// lib/accounts.ts
export type Account = {
  id: string;
  name: string;
  role: string;
  balance: number;
  uid?: string;
};

export const SEED_ACCOUNTS: Account[] = [
  { id: "customer",   name: "Customer",       role: "customer", balance: 1000, uid: "CUSTOMER_CARD" },
  { id: "restaurant", name: "The Restaurant", role: "merchant", balance: 0 },
  { id: "maria",      name: "Maria (server)", role: "worker",   balance: 0, uid: "MARIA_CARD" },
  { id: "tacostand",  name: "Taco Stand",     role: "merchant", balance: 0 },
  { id: "agent",      name: "Cash Agent",     role: "agent",    balance: 5000 },
];

export const UID_MAP: Record<string, string> = {
  CUSTOMER_CARD: "customer",
  MARIA_CARD: "maria",
};

export const OUR_FEE = 0.01;
export const DEMO_BILL_TOTAL = 250;
export const DEMO_TIP = 50;
export const DEMO_SPEND = 40;
```

### Fee helpers

```ts
// lib/fees.ts
squareFee(amount: number): number  // amount * 0.026 + 0.10
ourFee(_amount?: number): number    // OUR_FEE (0.01), flat
```

### Ledger operations

```ts
// lib/ledger.ts — module-level singleton; persists across imports in next dev

payBill(
  customerId: string,
  merchantId: string,
  total: number,
  tip: number,
  tipRecipientId: string
): {
  merchantCredited: number;
  tipCredited: number;
  breakdown: { food: number; tip: number };
};
// debit customer `total`; credit merchant `total - tip`; credit tip recipient `tip`

spend(
  fromId: string,
  toId: string,
  amount: number
): {
  amount: number;
  ourFee: number;
  squareFee: number;
};
// debit from `amount`; credit to `amount`; ourFee = OUR_FEE (display only, not deducted from balance)

cashOut(accountId: string): { cashHanded: number };
// agent balance += worker balance; worker balance → 0

getState(): Account[];  // full snapshot (return copies, not mutable refs)
```

**Invariants:**
- Throw or return clear errors if an account is missing or balance would go negative.
- `getState()` returns a snapshot safe for React to diff — do not leak internal mutable arrays.
- Initialize from `SEED_ACCOUNTS` on first import; no database.

---

## Step-by-step tasks

- [ ] Create `lib/accounts.ts` with `Account` type, `SEED_ACCOUNTS`, `UID_MAP`, `OUR_FEE`, and demo constants
- [ ] Create `lib/fees.ts` with `squareFee(amount)` = `amount * 0.026 + 0.10` and `ourFee()` = `OUR_FEE`
- [ ] Create `lib/ledger.ts`:
  - [ ] Module singleton holding account balances (clone from `SEED_ACCOUNTS` on init)
  - [ ] `payBill` — debit customer, split food vs tip to merchant and tip recipient
  - [ ] `spend` — transfer between accounts; compute `ourFee` and `squareFee` for display (fee not deducted from user balance)
  - [ ] `cashOut` — move tapped account balance to agent float, zero worker
  - [ ] `getState` — return full account snapshot
- [ ] Create `lib/ledger.test.ts`:
  - [ ] Fresh ledger per test (re-import or export a `reset()` helper for tests only)
  - [ ] `payBill("customer","restaurant",250,50,"maria")` → customer 750, restaurant 200, maria 50
  - [ ] `spend("maria","tacostand",40)` → maria 10, tacostand 40; `ourFee` 0.01; `squareFee` ≈ 1.14
  - [ ] `cashOut("maria")` with balance 50 → maria 0, agent 5050, `cashHanded` 50
- [ ] Add vitest script to `package.json` if missing: `"test": "vitest run"`
- [ ] Run tests green before handing off to Phase 2

---

## Acceptance tests

```bash
# Unit tests pass
npm test
# OR: npx vitest run lib/ledger.test.ts

# Manual sanity (optional — paste in node REPL or a scratch script)
# After payBill("customer","restaurant",250,50,"maria"):
#   customer.balance === 750
#   restaurant.balance === 200
#   maria.balance === 50

# After spend("maria","tacostand",40):
#   maria.balance === 10
#   tacostand.balance === 40
#   result.ourFee === 0.01
#   result.squareFee close to 1.14 (40 * 0.026 + 0.10)

# After cashOut("maria") starting from 50:
#   maria.balance === 0
#   agent.balance === 5050
```

**Done when:** All three operations match the numbers above; tests are committed; `contracts.md` signatures are unchanged.

---

## Paste-ready agent prompt

```
Create an in-memory ledger for the Loop payments demo (Next.js + TypeScript). Read Build/contracts.md and implement exactly these files:

1. lib/accounts.ts — Account type, SEED_ACCOUNTS (customer 1000, restaurant/maria/tacostand 0, agent 5000), UID_MAP (CUSTOMER_CARD→customer, MARIA_CARD→maria), OUR_FEE=0.01, demo constants DEMO_BILL_TOTAL=250, DEMO_TIP=50, DEMO_SPEND=40.

2. lib/fees.ts — squareFee(amount) = amount * 0.026 + 0.10; ourFee() = OUR_FEE flat 0.01.

3. lib/ledger.ts — module singleton initialized from SEED_ACCOUNTS. Implement:
   - payBill(customerId, merchantId, total, tip, tipRecipientId): debit customer total; credit merchant (total - tip); credit tip recipient tip; return { merchantCredited, tipCredited, breakdown: { food, tip } }.
   - spend(fromId, toId, amount): debit from, credit to; return { amount, ourFee, squareFee } where ourFee is OUR_FEE (display only, not deducted from balances).
   - cashOut(accountId): agent balance += account balance; zero account; return { cashHanded }.
   - getState(): Account[] snapshot (safe copies).

4. lib/ledger.test.ts (vitest) proving:
   - payBill("customer","restaurant",250,50,"maria") → 750/200/50
   - spend("maria","tacostand",40) → maria 10, tacostand 40, ourFee 0.01, squareFee ≈ 1.14
   - cashOut("maria") with 50 balance → maria 0, agent 5050

No database, no UI, no API routes. Guard against negative balances. Do not change contracts.md.
```

---

## Fallback if blocked

| Blocker | Fallback |
|---|---|
| Vitest won't run | Add `"test": "vitest run"` and `vitest` devDep; or run assertions in a one-off `scripts/ledger-smoke.ts` with `tsx` |
| Unclear fee semantics | `ourFee` is **display-only** — do not subtract from maria's balance on spend; judges see $0.01 vs Square $1.14 in Phase 3 |
| Negative balance edge cases | Throw `Error("Insufficient balance")` — Phase 2 will surface in Terminal; don't silently clamp |
| Team waiting on ledger | Person B/C scaffold empty component files; Person A ships ledger first — nothing else blocks |

---

## Next phase

→ [`02-dashboard-simulate.md`](02-dashboard-simulate.md) — **depends on this phase**
