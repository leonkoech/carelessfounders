# Phase 2 — Dashboard + simulate taps

**Goal:** A single-screen dashboard showing every account balance, a terminal to charge/spend/cash-out, and **simulate buttons** that fire taps. Money visibly moves between boxes on each tap. **Fully functional with no bridge, no reader, no Solana.** This is the whole demo's guaranteed floor.

| | |
|---|---|
| **Owner** | **Person A** (integrator: `page.tsx`, `handleTap`, API wiring) + **Person B** (UI: components) |
| **Depends on** | [Phase 1 — Ledger core](./01-ledger-core.md) |
| **Estimated time** | 60–75 min |
| **Required** | Yes — **shippable demo when this phase passes** |

---

## Files to create

| Path | Owner | Purpose |
|---|---|---|
| `app/page.tsx` | A | Single-screen dashboard; wires ledger, Terminal, cards, SimulateBar |
| `components/AccountCard.tsx` | B | One balance box; animates on change |
| `components/Terminal.tsx` | B | Mode selector + amount/tip inputs + "Waiting for tap…" |
| `components/SimulateBar.tsx` | B | One button per tappable account → `handleTap(uid)` |
| `lib/tapSource.ts` | A | Simulate-only tap dispatch (no WebSocket yet) |

Optional thin API layer (pick one approach — A decides):

| Path | Purpose |
|---|---|
| `app/api/ledger/route.ts` | GET state / POST operation (if not importing ledger client-side) |

**Out of scope this phase:** `SplitAnimation`, `FeeLine`, `SolanaPanel`, `bridge/*`, WebSocket in `tapSource.ts`.

---

## Contracts (frozen — match [`contracts.md`](contracts.md))

### Tap seam (the architectural principle)

> A tap is just a UID string at `handleTap(uid)`. Nothing downstream cares where the UID came from.

```ts
type TapEvent = {
  type: "tap";
  uid: string;
  source: "reader" | "esp32" | "sim";
  ts: number;
};
```

Phase 2 implements **simulate path only**. Phase 5 adds WebSocket subscription to the same handler.

### `handleTap` behavior

```ts
// app/page.tsx (or lib/tapHandler.ts if extracted — A owns this)
handleTap(uid: string): void;

// 1. Resolve uid via UID_MAP → account id (ignore unknown UIDs with user-visible error)
// 2. Apply current Terminal mode:
//    Charge  → payBill("customer", "restaurant", total, tip, "maria")  [only if tapped account is customer]
//    Spend   → spend("maria", "tacostand", amount)                     [only if tapped account is maria]
//    CashOut → cashOut(tappedAccountId)                                [stretch — wire if time]
// 3. Refresh dashboard state from ledger.getState()
```

### Terminal modes

```ts
type TerminalMode = "charge" | "spend" | "cashout";
```

| Mode | Who taps | Defaults | Ledger call |
|---|---|---|---|
| Charge Bill | Customer (`CUSTOMER_CARD`) | total 250, tip 50 | `payBill(customer, restaurant, total, tip, maria)` |
| Spend | Maria (`MARIA_CARD`) | amount 40, merchant tacostand | `spend(maria, tacostand, amount)` |
| Cash Out | Worker | — | `cashOut(tapped account)` |

### `lib/tapSource.ts` (simulate-only)

```ts
// Phase 2 — no WebSocket
export type TapCallback = (uid: string) => void;

export function simulateTap(uid: string, onTap: TapCallback): void {
  onTap(uid); // source: "sim" — optional TapEvent wrapper for logging
}

// Phase 5 adds: connectTapBridge(onTap) → subscribes to ws://localhost:7071
```

### Component props (suggested — stable for Phase 3 wiring)

```ts
// AccountCard
{ account: Account; previousBalance?: number }

// Terminal
{
  mode: TerminalMode;
  onModeChange: (mode: TerminalMode) => void;
  total: number;
  tip: number;
  amount: number;
  onTotalChange: (n: number) => void;
  onTipChange: (n: number) => void;
  onAmountChange: (n: number) => void;
  waiting: boolean;
}

// SimulateBar
{ accounts: Account[]; onSimulateTap: (uid: string) => void }
```

---

## Step-by-step tasks

### Person A — integration

- [ ] Create `app/page.tsx` as the single-screen dashboard layout
- [ ] Import ledger (`getState`, `payBill`, `spend`, `cashOut`) — client import or `/api/ledger` (pick one, document in code comment)
- [ ] Hold React state: `accounts` snapshot, `TerminalMode`, amounts (default total 250, tip 50, spend 40)
- [ ] Implement `handleTap(uid)` per contract above — **single entry point** for all tap sources
- [ ] After each successful operation, call `getState()` and update React state
- [ ] Create `lib/tapSource.ts` with `simulateTap(uid, onTap)` — no WebSocket yet
- [ ] Wire `SimulateBar` buttons → `simulateTap(account.uid!, handleTap)`
- [ ] Set Terminal to `waiting: true` after mode/amount change until next tap completes

### Person B — UI components

- [ ] `AccountCard.tsx` — name, role label, **large** balance (`text-4xl` or bigger for stage)
- [ ] Balance change animation: count-up and/or brief flash/highlight on diff
- [ ] `Terminal.tsx` — mode tabs (Charge Bill / Spend / Cash Out)
- [ ] Charge mode: total + tip inputs; Spend mode: amount input; Cash Out: minimal copy
- [ ] Show **"Waiting for tap…"** when armed and idle
- [ ] `SimulateBar.tsx` — one button per account with `uid`: `Simulate: {name} taps`
- [ ] Tailwind styling: high contrast, legible at projection distance

### Joint checkpoint

- [ ] Run acceptance script below with **no bridge running**
- [ ] Confirm Maria's UID works for both receiving tip (via customer charge) and spending
- [ ] Person A merges B's components into `page.tsx`

---

## Acceptance tests

**Environment:** `npm run dev` only. Bridge and Solana **not** required.

### Demo script (manual — this is the judge path)

1. Open `http://localhost:3000`
2. Confirm 5 account cards: Customer 1000, Restaurant 0, Maria 0, Taco Stand 0, Agent 5000
3. Terminal → **Charge Bill**, total **250**, tip **50**
4. Click **"Simulate: Customer taps"**
5. Balances animate to: **Customer 750**, **Restaurant 200**, **Maria 50**
6. Terminal → **Spend**, amount **40**
7. Click **"Simulate: Maria taps"**
8. Balances: **Maria 10**, **Taco Stand 40** (others unchanged)

### Automated / CLI checks

```bash
# App boots
npm run dev
# → http://localhost:3000 renders 5 AccountCards + Terminal + SimulateBar

# TypeScript clean
npx tsc --noEmit

# No bridge dependency — grep should show no WS connect in tapSource yet
grep -r "WebSocket\|7071" lib/tapSource.ts
# → no matches (Phase 5 adds this)
```

**Done when:** Steps 1–8 pass reliably; simulate buttons work with bridge **offline**; balances animate on change.

---

## Paste-ready agent prompt

```
Build the hardware-free dashboard for the Loop payments demo. Phase 1 ledger already exists in lib/ledger.ts, lib/accounts.ts, lib/fees.ts — import it, do not rewrite.

Create:

1. app/page.tsx — single-screen dashboard. Top: AccountCard per account from ledger.getState(). Center: Terminal. Bottom: SimulateBar. Hold React state for accounts, terminal mode, amounts (defaults: charge 250/50, spend 40). Implement handleTap(uid):
   - Resolve uid via UID_MAP
   - Charge mode + customer tap → payBill("customer","restaurant", total, tip, "maria")
   - Spend mode + maria tap → spend("maria","tacostand", amount)
   - Cash Out mode → cashOut(tapped account) if wired
   - Refresh state from getState() after each op

2. components/AccountCard.tsx — name + big balance, animate (count-up/flash) when balance changes.

3. components/Terminal.tsx — mode selector (Charge Bill / Spend / Cash Out), inputs for total+tip or amount, "Waiting for tap…" when armed.

4. components/SimulateBar.tsx — button per account with uid: "Simulate: {name} taps" → calls handleTap(uid).

5. lib/tapSource.ts — simulate-only: simulateTap(uid, onTap) calls onTap(uid). NO WebSocket yet (Phase 5).

Tailwind. Balances BIG for stage projection. Simulate buttons must work with no bridge running. Do not build SplitAnimation, FeeLine, SolanaPanel, or bridge/ yet.
```

---

## Fallback if blocked

| Blocker | Fallback |
|---|---|
| Reader / bridge not ready | **Expected.** Simulate buttons *are* the demo — skip bridge entirely tonight if behind |
| Client vs server ledger import issues | Add thin `app/api/ledger/route.ts` (GET state, POST `{ op, ...args }`); page fetches instead of direct import |
| Animations eating time | Ship static balance updates first; add count-up flash in Phase 7 polish |
| Wrong account tapped | Show toast/banner: "Tap Customer card for Charge mode" — don't silently no-op |
| Person B blocked on A | B builds components with mock props; A integrates when ledger lands (~45 min) |
| Cash Out not wired | **OK for MVP** — Charge + Spend path is the committed demo; Cash Out is stretch per PRD |

---

## Demo narration checkpoint (after this phase)

You can demo end-to-end **right now** with simulate buttons:

1. "Customer taps to pay $250 — $200 food, $50 tip splits instantly to Maria."
2. "Maria taps at the taco stand — $40 moves for a penny, not Square's cut."

Solana Explorer link and fee kill-shot come in Phases 3–4. **You are safe to ship if time runs out after Phase 2.**

---

## Next phases

→ [Phase 3 — Split animation + fee line](./phase-03-visuals.md) (visual payoffs)  
→ [Phase 4 — Solana devnet tx](./phase-04-solana.md) (Explorer link)  
→ Optional: [Phase 5 — Tap bridge](./phase-05-bridge.md) (real hardware path)
