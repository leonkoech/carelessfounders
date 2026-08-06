# Frozen contracts

**Do not change these without team agreement.** Parallel work depends on stable interfaces. Copy relevant sections into agent prompts when building any phase.

**References:** [`buildplan.md`](../buildplan.md) §4, [`prd.md`](../prd.md)

**Time to read:** 5 min (every builder, before coding)

---

## Goal

Define the shared API surface — types, seed data, ledger signatures, tap events, fee helpers, Solana settle shape, and bridge ingress — so Phases 1–7 can be built in parallel without merge conflicts on interfaces.

---

## Files these contracts govern

| File | Owner phase | Contract sections used |
|------|-------------|------------------------|
| `lib/accounts.ts` | Phase 1 | Account, SEED_ACCOUNTS, UID_MAP, OUR_FEE, demo constants |
| `lib/ledger.ts` | Phase 1 | payBill, spend, cashOut, getState, reset |
| `lib/fees.ts` | Phase 1 | squareFee, ourFee |
| `lib/tapSource.ts` | Phase 2, 5 | TapEvent, handleTap subscription |
| `app/page.tsx` | Phase 2 | handleTap, TerminalMode |
| `lib/solana.ts` | Phase 4 | settle() return shape |
| `app/api/settle/route.ts` | Phase 4 | POST body/response |
| `bridge/server.js` | Phase 5 | HTTP ingress + WS broadcast |

---

## Account type

```ts
// lib/accounts.ts
export type Account = {
  id: string;
  name: string;
  role: "customer" | "merchant" | "worker" | "agent" | string;
  balance: number;
  uid?: string;
};
```

---

## Seed accounts

```ts
export const SEED_ACCOUNTS: Account[] = [
  { id: "customer",   name: "Customer",       role: "customer", balance: 1000, uid: "CUSTOMER_CARD" },
  { id: "restaurant", name: "The Restaurant", role: "merchant", balance: 0 },
  { id: "maria",      name: "Maria (server)", role: "worker",   balance: 0, uid: "MARIA_CARD" },
  { id: "tacostand",  name: "Taco Stand",     role: "merchant", balance: 0 },
  { id: "agent",      name: "Cash Agent",     role: "agent",    balance: 5000 },
];
```

---

## UID map

```ts
// UID string → account id. Add real reader UIDs here after hardware test (Phase 6).
export const UID_MAP: Record<string, string> = {
  CUSTOMER_CARD: "customer",
  MARIA_CARD: "maria",
  // e.g. "04A2B1C3": "maria"  // real MIFARE UID from hardware test
};
```

**Rule:** Unknown UIDs must be ignored (no-op or toast), never crash the demo.

---

## Demo constants

Use these numbers everywhere — stage narration, tests, and UI defaults must match.

```ts
export const OUR_FEE = 0.01;

export const DEMO_BILL_TOTAL = 250;   // $200 food + $50 tip
export const DEMO_TIP = 50;
export const DEMO_SPEND = 40;

// Expected balances after demo script:
// After payBill:  customer 750, restaurant 200, maria 50
// After spend:    maria 10, tacostand 40, squareFee ≈ 1.14
```

---

## Ledger function signatures

```ts
// lib/ledger.ts — module-level singleton; persists across API calls in `next dev`

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

spend(
  fromId: string,
  toId: string,
  amount: number
): {
  amount: number;
  ourFee: number;
  squareFee: number;
};

cashOut(accountId: string): {
  cashHanded: number;
};

getState(): Account[];

reset(): void;  // Phase 7 — re-seed to SEED_ACCOUNTS
```

### Behavior (frozen)

| Function | Debits | Credits | Notes |
|----------|--------|---------|-------|
| `payBill` | customer `total` | merchant `total - tip`, tipRecipient `tip` | `breakdown.food = total - tip`, `breakdown.tip = tip` |
| `spend` | from `amount` | to `amount` | `ourFee = OUR_FEE` (display only); `squareFee = squareFee(amount)` |
| `cashOut` | worker balance → 0 | agent += worker's former balance | Returns `{ cashHanded }` |
| `getState` | — | — | Full account snapshot for dashboard |
| `reset` | — | — | Restore all balances from `SEED_ACCOUNTS` |

**Invariant:** Ledger throws or returns error on insufficient balance — never go negative silently.

---

## Fee helpers

```ts
// lib/fees.ts
squareFee(amount: number): number;  // amount * 0.026 + 0.10  (Square tap: 2.6% + $0.10)
ourFee(_amount?: number): number;    // OUR_FEE (0.01), flat
```

**Acceptance math:**
- `squareFee(40)` ≈ `1.14` (40 × 0.026 + 0.10 = 1.14)
- `ourFee()` → `0.01` regardless of amount

---

## Tap event contract

```ts
type TapEvent = {
  type: "tap";
  uid: string;
  source: "reader" | "esp32" | "sim";
  ts: number;
};
```

### Single UI entry point

```ts
handleTap(uid: string): void;
```

**Resolution flow:**
1. Look up `uid` in `UID_MAP` → account id
2. Read current `TerminalMode`
3. Apply operation:

| Mode | Who taps | Operation |
|------|----------|-----------|
| `charge` | Customer (`CUSTOMER_CARD`) | `payBill("customer", "restaurant", total, tip, "maria")` |
| `spend` | Worker (`MARIA_CARD`) | `spend("maria", "tacostand", amount)` |
| `cashout` | Worker | `cashOut("maria")` — stretch beat |

**Architectural rule:** Hardware, WebSocket bridge, and simulate buttons all call the same `handleTap(uid)`. Nothing downstream inspects `source`.

---

## Terminal modes

```ts
type TerminalMode = "charge" | "spend" | "cashout";
```

Default merchant for spend: `"tacostand"`. Default tip recipient for charge: `"maria"`.

---

## Solana settle contract

```ts
// lib/solana.ts
settle(amount: number): Promise<{
  sig: string;
  fallback: boolean;
}>;
// On any error: return { sig: process.env.FALLBACK_TX_SIG!, fallback: true }

// app/api/settle/route.ts
// POST { amount?: number } → { sig: string, fallback: boolean }
```

**Explorer URL (always devnet):**
```
https://explorer.solana.com/tx/{sig}?cluster=devnet
```

**Rule:** Solana is off the critical path. A slow or failed settle must never block ledger taps or balance updates.

**Stage honesty:** Say "stablecoin-style SPL token on Solana devnet" — not Circle mainnet USDC.

---

## Bridge contracts (Phase 5+, optional)

### HTTP ingress

```
POST http://localhost:7071/tap
Content-Type: application/json

{ "uid": "MARIA_CARD", "source": "esp32" | "reader" | "sim" }
```

### WebSocket broadcast (to UI)

```json
{ "type": "tap", "uid": "MARIA_CARD", "source": "sim", "ts": 1690000000000 }
```

**Env:** `NEXT_PUBLIC_BRIDGE_URL=ws://localhost:7071`

**Rule:** Simulate buttons must work with bridge offline.

---

## Environment variables

```env
TREASURY_SECRET=<base58 secret key>
MINT_ADDRESS=<spl mint pubkey>
RECIPIENT_ADDRESS=<recipient pubkey>
FALLBACK_TX_SIG=<a real confirmed devnet signature>
NEXT_PUBLIC_BRIDGE_URL=ws://localhost:7071
```

---

## Acceptance tests (contract compliance)

Run these after Phase 1; re-run after any contract change:

- [ ] `payBill("customer","restaurant",250,50,"maria")` → customer 750, restaurant 200, maria 50
- [ ] `spend("maria","tacostand",40)` → maria 10, tacostand 40; `ourFee` 0.01; `squareFee` ≈ 1.14
- [ ] `cashOut("maria")` with balance 10 → maria 0, agent 5010, `cashHanded` 10
- [ ] `UID_MAP["CUSTOMER_CARD"]` → `"customer"`; unknown UID → safe no-op
- [ ] `TapEvent` shape matches bridge WS payload
- [ ] `settle()` error path returns `fallback: true` with valid Explorer link
- [ ] `reset()` restores all `SEED_ACCOUNTS` balances

---

## Agent prompt (contract implementer — Phase 1)

> Implement frozen contracts from `Build/contracts.md` in `lib/accounts.ts`, `lib/ledger.ts`, and `lib/fees.ts`. Use the exact types, seed data, UID_MAP, and function signatures specified. Ledger is a module singleton. Implement `payBill`, `spend`, `cashOut`, `getState`, and stub `reset()` (full reset in Phase 7). Add `squareFee(amount) = amount * 0.026 + 0.10` and flat `ourFee() = 0.01`. Add a tiny test proving: bill 250/50 → 750/200/50; spend 40 → ourFee 0.01, squareFee ≈ 1.14. Do not change any exported signature without team agreement. No database, no UI.

---

## Change protocol

1. Propose change in team chat with reason
2. All active phase owners acknowledge
3. Update this file first, then implementations
4. Re-run acceptance tests above
