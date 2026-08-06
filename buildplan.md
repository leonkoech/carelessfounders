# Ship Night — Build Plan (agent-executable)

A closed-loop stablecoin tap-payment demo. Customer taps a card to pay a bill, the tip splits off and lands on a worker's card instantly, the worker spends it at a second merchant for a ~$0.01 fee, and one **real Solana devnet transaction** proves it's on-chain. Optional 4th beat: cash-out at an agent.

**How to use this doc:** Each phase below has a **goal**, the **files** it touches, an **acceptance test**, and a **paste-ready prompt** for a coding agent. Build phases in order. Phases 1–4 are the demo; Phases 5–6 are optional hardware that bolts on without changing anything upstream.

---

## 0. The one architectural principle (read this first)

> **A "tap" is just a UID string arriving at a single handler `handleTap(uid)`. Nothing downstream cares where the UID came from.**

Three possible tap sources all call the exact same handler:
1. **Simulate button** in the UI → calls `handleTap(uid)` directly. *No hardware, no bridge, no network.* This is the demo's guaranteed floor.
2. **ACR122U** USB reader → `nfc-pcsc` in the bridge → WebSocket → `handleTap(uid)`.
3. **ESP32 + PN532** → HTTP POST to the bridge → WebSocket → `handleTap(uid)`.

Because of this seam, **the demo is fully winnable software-only.** Hardware is additive. If a reader dies on stage, you click the button and the demo is byte-for-byte identical. Build Phase 2 first and you have a shippable demo before you touch a single wire.

---

## 1. Scope (this is your 6:30 PRD lock)

**IN (must ship, judged on this):**
- Live dashboard showing all account balances updating in real time.
- Charge a bill with an embedded tip; tip auto-splits to the worker.
- Worker spends in-network at a second merchant; ~$0.01 fee shown vs Square's fee struck through.
- **One real Solana devnet SPL token transfer**, signature shown on Solana Explorer.
- Tap-driven interaction (via simulate button at minimum; real reader if available).

**OUT (explicitly not built — say so in the PRD):**
- No real card charging / Visa acceptance (we read UID as identity only).
- No bank off-ramp, no card issuance, no KYC, no auth/login.
- No production wallets or per-user key custody (one treasury wallet only).
- No persistent database (in-memory ledger; resets on restart — fine for a demo).
- Agent cash-out (Beat 4) is **optional**, gated behind "am I ahead of schedule."

Writing the OUT list into the PRD protects you: you can't be dinged for missing something you explicitly scoped out.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js (App Router) + TypeScript** | You know it; one repo for UI + API. |
| State | **In-memory ledger** (module singleton) | Zero DB setup, most reliable for a demo that resets. |
| Realtime | **Native WebSocket** via a tiny standalone bridge | Simple, local, hardware-agnostic. |
| Chain | **@solana/web3.js + @solana/spl-token**, devnet | Superteam prize = Solana. Self-minted SPL token for reliability. |
| Styling | **Tailwind** | Fast, and the fee line / balance animations need to be big and bold on stage. |
| Bridge | **Node + ws + nfc-pcsc** (separate process) | Only needed when real hardware is present. |

Deliberately **no Supabase / no Postgres** — a DB is setup time and a failure surface you don't need for a 3-hour demo that resets between runs.

---

## 3. Repository structure

```
ship-night/
  app/
    page.tsx                # the single-screen dashboard (the whole demo)
    layout.tsx
    globals.css
    api/
      settle/route.ts       # POST -> fires the real Solana devnet tx, returns signature
  lib/
    ledger.ts               # in-memory accounts + operations (pure logic)
    accounts.ts             # seed data: accounts, UID->account map, demo constants
    fees.ts                 # our fee vs Square fee helpers
    solana.ts               # devnet connection + treasury transfer + fallback sig
    tapSource.ts            # subscribes to bridge WS; exposes onTap; simulate fallback
  components/
    AccountCard.tsx         # one balance box, animates on change
    Terminal.tsx            # mode selector + amount input + "waiting for tap"
    SplitAnimation.tsx      # $250 visibly splitting into $200 / $50
    FeeLine.tsx             # $0.01 vs Square struck-through
    SolanaPanel.tsx         # last real tx + explorer link
    SimulateBar.tsx         # buttons that fire taps (the insurance policy)
  bridge/
    server.js               # WS server + HTTP /tap ingress (ESP32/curl) + nfc-pcsc
    acr122u.js              # optional: nfc-pcsc listener -> broadcast
  scripts/
    solana-setup.ts         # RUN ONCE (night before): create mint, fund treasury, print .env
  .env.local                # secrets + demo config (see §9)
  package.json
```

---

## 4. Data model & core contracts

### Accounts (seed)
```ts
// lib/accounts.ts
export type Account = { id: string; name: string; role: string; balance: number; uid?: string };

export const SEED_ACCOUNTS: Account[] = [
  { id: "customer",   name: "Customer",      role: "customer", balance: 1000, uid: "CUSTOMER_CARD" },
  { id: "restaurant", name: "The Restaurant", role: "merchant", balance: 0 },
  { id: "maria",      name: "Maria (server)", role: "worker",   balance: 0, uid: "MARIA_CARD" },
  { id: "tacostand",  name: "Taco Stand",     role: "merchant", balance: 0 },
  { id: "agent",      name: "Cash Agent",     role: "agent",    balance: 5000 }, // float for cash-out
];

// UID -> account id. Real reader UIDs get mapped here once you know them.
export const UID_MAP: Record<string, string> = {
  CUSTOMER_CARD: "customer",
  MARIA_CARD: "maria",
  // e.g. "04A2B1C3": "maria"  // real card UID from Wednesday test
};

export const OUR_FEE = 0.01;
```

### Ledger operations (pure, testable)
```ts
// lib/ledger.ts — signatures the UI depends on
payBill(customerId, merchantId, total, tip, tipRecipientId):
    // debit customer `total`; credit merchant `total - tip`; credit tipRecipient `tip`
    // returns { merchantCredited, tipCredited, breakdown }
spend(fromId, toId, amount):
    // debit from `amount`; credit to `amount`; fee = OUR_FEE (borne by system, near-zero)
    // returns { amount, ourFee, squareFee }
cashOut(accountId):
    // agentFloat += balance; set balance 0; returns { cashHanded }
getState(): Account[]   // full snapshot for the dashboard
```

### Tap event contract (the seam)
```ts
// what the bridge broadcasts and what the UI consumes
type TapEvent = { type: "tap"; uid: string; source: "reader" | "esp32" | "sim"; ts: number };
```

### Fee helper
```ts
// lib/fees.ts
squareFee(amount) => amount * 0.026 + 0.10   // Square tap: 2.6% + $0.10
ourFee(_amount)   => OUR_FEE                  // ~$0.01, flat
```

---

## 5. Phase-by-phase build plan

### Phase 1 — Ledger core (pure logic, no UI)
**Goal:** All money math works and is unit-testable in isolation.
**Files:** `lib/ledger.ts`, `lib/accounts.ts`, `lib/fees.ts`
**Acceptance:** `payBill("customer","restaurant",250,50,"maria")` leaves customer 750, restaurant 200, maria 50. `spend("maria","tacostand",40)` leaves maria 10, tacostand 40, reports ourFee 0.01 and squareFee ≈ 1.14. `cashOut("maria")` zeroes maria.

> **Agent prompt:**
> "Create an in-memory ledger for a payments demo in `lib/ledger.ts`, `lib/accounts.ts`, `lib/fees.ts` (Next.js + TypeScript). Seed accounts per the spec I'll paste. Implement `payBill`, `spend`, `cashOut`, `getState` exactly as specified, plus `squareFee` (2.6% + $0.10) and a flat `ourFee` of $0.01. Ledger state is a module-level singleton so it persists across API calls in `next dev`. Add a tiny test file proving: paying a $250 bill with a $50 tip splits to 750/200/50, and a $40 spend reports our fee $0.01 vs Square ≈ $1.14. No database, no external deps."

---

### Phase 2 — Dashboard + simulate taps (THIS IS THE WHOLE DEMO, hardware-free)
**Goal:** A single screen showing every account balance, a terminal to charge/spend/cashout, and **simulate buttons** that fire taps. Money visibly moves between boxes on each tap. Fully functional with no hardware.
**Files:** `app/page.tsx`, `components/AccountCard.tsx`, `components/Terminal.tsx`, `components/SimulateBar.tsx`, `lib/tapSource.ts` (simulate-only path for now)
**Acceptance:** With no bridge and no reader running, you can: set bill $250 + tip $50 → click "Simulate: Customer taps" → balances animate to 750/200/50; switch terminal to Spend $40 → "Simulate: Maria taps" → 10/40. The demo is winnable right here.

> **Agent prompt:**
> "Build a single-screen dashboard in `app/page.tsx` for the ledger from Phase 1. Top row: an `AccountCard` per account showing name + balance, animating (count-up + flash) whenever its balance changes. Center: a `Terminal` component with a mode selector (Charge Bill / Spend / Cash Out), inputs for amount and (in Charge mode) tip, and a 'Waiting for tap…' state. A `SimulateBar` renders one button per account labelled 'Simulate: {name} taps' that calls `handleTap(account.uid)`. `handleTap(uid)` resolves the UID to an account via `UID_MAP` and applies the current terminal mode's operation (Charge → `payBill` with tip routed to Maria; Spend → `spend` to the selected merchant; Cash Out → `cashOut`). All state client-side via React; call ledger ops through simple `/api/*` routes or direct imports. Make balances BIG and legible for stage projection. Tailwind. No hardware yet — simulate buttons are the only tap source."

---

### Phase 3 — Split animation + fee line (the two visual payoffs)
**Goal:** The tip visibly splitting, and the fee kill-shot on screen.
**Files:** `components/SplitAnimation.tsx`, `components/FeeLine.tsx`, wire into `page.tsx`
**Acceptance:** Charging the bill shows $250 splitting into $200 → Restaurant and $50 → Maria (motion). Spending shows `Our fee: $0.01` next to `Square: $1.14` struck through, the Square number visibly larger/red.

> **Agent prompt:**
> "Add two components. `SplitAnimation`: on a bill payment, briefly animate the total splitting into two labelled amounts flying to the restaurant card and Maria's card. `FeeLine`: after a spend, render 'Our fee $0.01' beside the Square fee (computed via `squareFee`) shown struck-through, larger, and red, so the contrast reads across a room. Keep both snappy (<1s). Trigger them from the existing tap handler in `page.tsx`."

---

### Phase 4 — Real Solana devnet transaction (isolated, with fallback)
**Goal:** One genuine on-chain SPL transfer, signature shown on Explorer. Isolated so it can never freeze the UI, with a pre-recorded signature fallback.
**Files:** `lib/solana.ts`, `app/api/settle/route.ts`, `components/SolanaPanel.tsx`, `scripts/solana-setup.ts`
**Acceptance:** Clicking "Settle on-chain" (or auto-firing after the tip lands) returns a real devnet signature within ~1–2s and renders a working `explorer.solana.com/tx/{sig}?cluster=devnet` link. If the live call throws, the panel shows the pre-recorded `FALLBACK_TX_SIG` and still links to a real confirmed tx.

**Pre-demo (run `scripts/solana-setup.ts` the NIGHT BEFORE):**
1. Generate a treasury `Keypair`.
2. `solana airdrop 2 <treasury> --url devnet` (or programmatic `requestAirdrop`) — **do this the night before; never faucet on stage.**
3. Create your own SPL mint (call it demo USDC), create treasury ATA, mint supply to it.
4. Do one warm-up transfer; save its signature as `FALLBACK_TX_SIG`.
5. Print `TREASURY_SECRET`, `MINT_ADDRESS`, `RECIPIENT_ADDRESS`, `FALLBACK_TX_SIG` into `.env.local`.

> **Why a self-minted token, not real devnet USDC:** you control supply, no faucet/mint dependency can rate-limit you mid-demo. On stage you *say* "USDC"; it's a dollar-denominated SPL token you own. Honest framing: "a stablecoin-style SPL token on Solana devnet." Don't claim it's Circle-issued mainnet USDC.

> **Agent prompt:**
> "Create `scripts/solana-setup.ts` (run once) using @solana/web3.js and @solana/spl-token on devnet: generate a treasury keypair, request an airdrop of SOL, create an SPL mint (9 decimals), create the treasury associated token account, mint 1,000,000 tokens to it, perform one warm-up transfer to a recipient keypair, and print TREASURY_SECRET (base58), MINT_ADDRESS, RECIPIENT_ADDRESS, and the warm-up signature (FALLBACK_TX_SIG) for pasting into .env.local. Then create `lib/solana.ts` with `settle(amount)` that transfers `amount` tokens treasury→recipient at 'confirmed' commitment and returns the signature; wrap in try/catch and on any error return `{ sig: FALLBACK_TX_SIG, fallback: true }`. Expose it via `app/api/settle/route.ts` (POST). Build `SolanaPanel.tsx` showing the latest signature as a link to https://explorer.solana.com/tx/{sig}?cluster=devnet, with a subtle 'settled live on Solana' label. Keep this entirely off the UI critical path — a slow/failed settle must never block the ledger demo."

---

### Phase 5 — The tap bridge (enables real hardware, optional)
**Goal:** A tiny local server that turns real reader events into the same `TapEvent` the simulate buttons already produce.
**Files:** `bridge/server.js`, update `lib/tapSource.ts` to subscribe to the bridge WS
**Acceptance:** With the bridge running, `curl -X POST localhost:7071/tap -d '{"uid":"MARIA_CARD"}'` moves money in the UI exactly as the simulate button does. Simulate buttons still work independently.

> **Agent prompt:**
> "Create `bridge/server.js`: a Node process using `ws` that (a) runs a WebSocket server on :7071 broadcasting `{type:'tap',uid,source,ts}` to all connected UIs, and (b) runs an HTTP endpoint `POST /tap {uid,source}` that ingests taps from an ESP32 or curl and rebroadcasts them over the WS. Update `lib/tapSource.ts` so the UI opens a WebSocket to ws://localhost:7071, and on a `tap` message calls the same `handleTap(uid)` used by the simulate buttons. The simulate buttons must keep working with the bridge offline. Log every tap to console for debugging."

---

### Phase 6 — Physical reader (pick ONE, both optional)
**Goal:** A real card tap emits a UID into the bridge.

**Option A — ACR122U (USB, PC/SC):** add `bridge/acr122u.js` using `nfc-pcsc`; on card detect, POST/emit `{uid}` to the bridge. Remember to disable auto-poll/buzzer to avoid phantom taps.

**Option B — ESP32 + PN532 (your bundle):** ESP32 reads the PN532 UID over SPI/I²C and does `HTTP POST http://<laptop-ip>:7071/tap {uid,source:"esp32"}` on each tap. **Run your own phone hotspot** so ESP32 and laptop share a private network — venue WiFi will fight you.

**Acceptance:** Tapping the bundled MIFARE card moves money in the UI. Map the real UID(s) into `UID_MAP` once known (from Wednesday's test).

> **Agent prompt (Option A):**
> "Add `bridge/acr122u.js` using `nfc-pcsc`: on 'card' events, read the UID and forward it to the bridge's `/tap` ingress (source:'reader'). Send the APDU to disable the ACR122U buzzer/auto-poll to prevent duplicate detections. Debounce so one physical tap = one event."

> **Firmware (Option B) — ask me separately:** I'll give you the ESP32 + PN532 wiring pinout and an Arduino sketch that reads the UID and POSTs it to the bridge. Target contract: `POST http://<laptop-ip>:7071/tap` body `{"uid":"<hex>","source":"esp32"}`.

---

### Phase 7 — Polish, rehearsal mode, fallbacks
- **Rehearsal mode:** a keyboard shortcut or `?sim=1` that guarantees simulate-only (never touches bridge), so you can practice the failure path.
- **Reset button:** re-seed the ledger to run the demo again cleanly.
- **Order of taps:** Maria's card does triple duty (receives tip → is tapped to reveal → spends). Confirm the same UID works across all three.
- **Big-screen check:** balances, fee line, and Explorer link all legible when projected.

---

## 6. Build order mapped to the night

| Time | Do |
|---|---|
| 4:00 | Arrive, log in, clone repo, `npm i`, get `next dev` running during onboarding. |
| 5:00–5:20 | Write & **submit the PRD early** (scope from §1). |
| 5:20–6:30 | **Phases 1–2** → a fully working, hardware-free demo. You're now safe. |
| 6:30–7:30 | **Phase 3** (split + fee line) then **Phase 4** (Solana). Run `solana-setup` output from the night before. |
| 7:30–8:30 | **Phase 5** bridge + **Phase 6** reader if hardware is behaving. If not, skip — you already have a demo. |
| 8:30–9:15 | Phase 7 polish + **rehearse twice**, once with the reader unplugged. |
| 9:15–9:30 | Freeze. Submit before the hard cutoff. Do not be editing at 9:29. |

---

## 7. Demo-day fallbacks (your insurance stack)

1. **Reader dies** → click the simulate button. Same event, identical demo.
2. **Bridge won't start** → simulate buttons don't need it; run `?sim=1`.
3. **Solana tx hangs/fails** → `settle()` returns `FALLBACK_TX_SIG`; you still show a real confirmed tx on Explorer.
4. **Devnet down entirely** → the fallback signature still links to a previously-confirmed tx; the ledger demo is unaffected because Solana is off the critical path.
5. **Venue WiFi blocks ESP32** → your own hotspot; or fall back to simulate.

Every failure has a one-action recovery that keeps the demo identical. That's what lets you tap the card on stage with confidence.

---

## 8. `.env.local` (from `solana-setup.ts`)
```
TREASURY_SECRET=<base58 secret key>
MINT_ADDRESS=<spl mint pubkey>
RECIPIENT_ADDRESS=<recipient pubkey>
FALLBACK_TX_SIG=<a real confirmed devnet signature>
NEXT_PUBLIC_BRIDGE_URL=ws://localhost:7071
```

## 9. Setup commands
```bash
npx create-next-app@latest ship-night --ts --tailwind --app
cd ship-night
npm i @solana/web3.js @solana/spl-token
npm i -D ws                       # bridge
npm i nfc-pcsc                     # only if using ACR122U
npx tsx scripts/solana-setup.ts    # run ONCE, night before; paste output into .env.local
npm run dev                        # the app
node bridge/server.js              # only when using real hardware
```

---

## 10. Honesty guardrails for the stage (bake into the narration, not the code)
- Say "**read the card as identity**," never "charged the card." You look up a UID; you don't process a payment.
- Say "**a stablecoin-style SPL token on Solana devnet**," not "Circle USDC on mainnet."
- The agent cash-out is "**the model proven by existing cash networks; the licensed buildout is the company.**"
- Zero-fee is "**inside the loop**"; the doors in/out pay normal rates. Don't claim zero everywhere.

Small, true claims beat big shaky ones in a no-slides room where a judge can ask a follow-up.