# Phase 4 — Real Solana devnet transaction

**Ship Night · Loop demo · Required**

One genuine on-chain SPL transfer with an Explorer link — isolated from the tap/ledger critical path, with a pre-recorded signature fallback.

---

## Goal

Expose `settle(amount)` that performs a **real devnet SPL token transfer** (treasury → recipient) and returns a transaction signature. The UI shows the signature as a link to Solana Explorer. If the live call fails or hangs, return **`FALLBACK_TX_SIG`** — a previously confirmed devnet tx — so the demo never stalls.

**Honesty:** On stage say *"stablecoin-style SPL token on Solana devnet"*, not Circle mainnet USDC.

---

## Owner role

| Team size | Owner |
|-----------|-------|
| 4 people | **Person C — Chain** |
| 3 people | Person C (Solana + QA) |
| 2 people | Person B (after ledger lands, parallel with Phase 3) |

**Integrator (Person A)** may add `SolanaPanel` to `app/page.tsx`; Person C owns all Solana files and `.env.local` keys.

---

## Depends on

| Phase | Why |
|-------|-----|
| **[Phase 0 — Setup](./00-setup.md)** | `@solana/web3.js`, `@solana/spl-token`, `tsx` |
| **[Phase 1 — Ledger](./01-ledger-core.md)** | **Only hard dependency** — ledger demo works without Solana |

**Parallelizes after Phase 1:** Person C can build `scripts/solana-setup.ts`, `lib/solana.ts`, `/api/settle`, and `SolanaPanel.tsx` while Person A/B finish Phase 2. Merge panel into dashboard when ready.

**Does not depend on:** Phase 2 dashboard (nice to have for panel placement), Phase 3 visuals, bridge, hardware.

**Blocks:** Superteam / on-chain success criterion in PRD. Does not block Phase 5–6.

---

## Files (exact paths)

| Action | Path |
|--------|------|
| Create (run once, night before) | `scripts/solana-setup.ts` |
| Create | `lib/solana.ts` |
| Create | `app/api/settle/route.ts` |
| Create | `components/SolanaPanel.tsx` |
| Modify | `app/page.tsx` — mount `SolanaPanel` (non-blocking) |
| Create / update (local only, never commit secrets) | `.env.local` |

**Do not touch:** `lib/ledger.ts`, `handleTap`, tap bridge, NFC.

---

## Contracts

Frozen — see [`contracts.md`](./contracts.md).

### `lib/solana.ts`

```ts
settle(amount: number): Promise<{
  sig: string;
  fallback: boolean;
}>;
// Success: { sig: "<live devnet signature>", fallback: false }
// Any error / timeout: { sig: FALLBACK_TX_SIG, fallback: true }
```

Implementation notes:
- Connection: Solana **devnet**, commitment **`confirmed`**
- Transfer SPL tokens from treasury ATA → recipient ATA
- Read secrets from env (server-side only); never expose `TREASURY_SECRET` to client
- Wrap entire tx path in try/catch; **never throw** to the UI

### `app/api/settle/route.ts`

```ts
// POST
// Body: { amount?: number }  // default e.g. 1 token unit or demo amount
// Response: { sig: string; fallback: boolean }
```

### Explorer URL (required pattern)

```
https://explorer.solana.com/tx/{sig}?cluster=devnet
```

### `.env.local` (from setup script output)

```bash
TREASURY_SECRET=<base58 secret key>
MINT_ADDRESS=<spl mint pubkey>
RECIPIENT_ADDRESS=<recipient pubkey>
FALLBACK_TX_SIG=<a real confirmed devnet signature>
```

Optional client config:

```bash
NEXT_PUBLIC_BRIDGE_URL=ws://localhost:7071   # Phase 5; unrelated to settle
```

### `SolanaPanel.tsx` (suggested props)

```ts
type SolanaPanelProps = {
  sig?: string | null;
  fallback?: boolean;
  loading?: boolean;
  onSettle?: () => void;   // triggers POST /api/settle
};
```

Display:
- Link text → Explorer URL above
- Live tx: subtle label e.g. **"Settled live on Solana devnet"**
- Fallback tx: subtle label e.g. **"Showing confirmed fallback transaction"** (do not hide that fallback was used — rehearse narration)

**Critical path rule:** Settle is **off** the tap/ledger path. Slow or failed settle must **never** block balance updates or simulate taps.

---

## Tasks

### Pre-demo (night before — not on stage)

- [ ] `npm i @solana/web3.js @solana/spl-token`
- [ ] Create `scripts/solana-setup.ts`
  - [ ] Generate treasury `Keypair`
  - [ ] Request devnet SOL airdrop (`requestAirdrop` or `solana airdrop`) — **do this night before; never faucet on stage**
  - [ ] Create SPL mint (9 decimals, demo stablecoin)
  - [ ] Create treasury ATA; mint supply (e.g. 1_000_000 tokens)
  - [ ] Perform one warm-up transfer to recipient keypair
  - [ ] Print `TREASURY_SECRET`, `MINT_ADDRESS`, `RECIPIENT_ADDRESS`, `FALLBACK_TX_SIG` for `.env.local`
- [ ] Run `npx tsx scripts/solana-setup.ts` and paste output into `.env.local`
- [ ] Verify warm-up tx opens in Explorer

### Implementation

- [ ] Create `lib/solana.ts` with `settle(amount)` per contract
- [ ] Load env vars; fail gracefully to `FALLBACK_TX_SIG`
- [ ] Create `app/api/settle/route.ts` — POST handler calling `settle`
- [ ] Create `components/SolanaPanel.tsx`
  - [ ] "Settle on-chain" button (or auto-fire after tip — team choice; must stay non-blocking)
  - [ ] Loading state; render signature as Explorer link
  - [ ] Show `fallback: true` state distinctly (muted badge, not an error toast)
- [ ] Mount panel on `app/page.tsx` — corner or footer; no modal blocking taps
- [ ] Confirm `TREASURY_SECRET` is **not** in client bundle (API route only)

### QA

- [ ] Live settle returns signature in ~1–2s on devnet
- [ ] Explorer link resolves to confirmed tx
- [ ] Simulate failure (wrong mint / offline): panel shows `FALLBACK_TX_SIG` link still works
- [ ] Ledger demo runs identically with Solana panel removed or failing

---

## Acceptance tests

### Test 1 — Live devnet settle

1. Ensure `.env.local` populated from setup script
2. Start `npm run dev`
3. Click **Settle on-chain** (or trigger settle action)
4. **Pass if:**
   - Response within ~1–2s with `{ sig, fallback: false }`
   - Explorer link opens confirmed devnet transaction
   - UI label indicates live settlement

### Test 2 — Fallback path

1. Temporarily break env (e.g. invalid `MINT_ADDRESS`) or disable network
2. Trigger settle again
3. **Pass if:**
   - Returns `{ sig: FALLBACK_TX_SIG, fallback: true }` without crashing
   - Explorer link for fallback sig still opens a **real previously confirmed** tx
   - Simulate taps and balance updates still work

### Test 3 — Off critical path

1. Run full demo script: Charge → Spend (simulate taps)
2. Do **not** click settle until after taps complete
3. **Pass if:** ledger balances correct regardless of settle state; settle never blocks `handleTap`

### Test 4 — Security sanity

1. Search client bundle / Network tab for settle request
2. **Pass if:** no `TREASURY_SECRET` in browser; only POST `/api/settle` from client

---

## Paste-ready agent prompt

```
Phase 4 — Real Solana devnet transaction (Ship Night / Loop demo)

Read Build/contracts.md and buildplan.md Phase 4. Do NOT modify lib/ledger.ts or handleTap.

Create scripts/solana-setup.ts (run once on devnet):
- Generate treasury Keypair
- Airdrop SOL on devnet
- Create SPL mint (9 decimals), treasury ATA, mint 1_000_000 tokens
- Warm-up transfer to recipient keypair
- Console-print TREASURY_SECRET (base58), MINT_ADDRESS, RECIPIENT_ADDRESS, FALLBACK_TX_SIG for .env.local

Create lib/solana.ts:
- settle(amount: number) → Promise<{ sig: string; fallback: boolean }>
- Transfer SPL tokens treasury→recipient at confirmed commitment
- try/catch everything; on error return { sig: FALLBACK_TX_SIG, fallback: true }

Create app/api/settle/route.ts:
- POST { amount?: number } → { sig, fallback }
- Server-side only; never expose TREASURY_SECRET to client

Create components/SolanaPanel.tsx:
- Button to trigger settle (non-blocking)
- Show sig as link: https://explorer.solana.com/tx/{sig}?cluster=devnet
- Label live vs fallback subtly

Wire SolanaPanel into app/page.tsx without blocking tap/ledger flow. Slow/failed settle must never freeze the demo.

Use self-minted demo token (not real devnet USDC). Honest framing: stablecoin-style SPL on devnet.
```

---

## Time estimate

| Segment | Duration |
|---------|----------|
| `solana-setup.ts` + run + `.env.local` | 30–45 min *(ideal: night before)* |
| `lib/solana.ts` + `/api/settle` | 25–35 min |
| `SolanaPanel.tsx` + page mount | 15–20 min |
| Explorer + fallback QA | 10–15 min |
| **Total** | **~60–90 min** *(~30 min if setup done night before)* |

Schedule: **6:30–7:30 PM**, parallel with Phase 3, per [`README.md`](./README.md).

**Parallel track (after Phase 1):** Person C can complete setup + `lib/solana.ts` during Phase 2 window.

---

## Fallback

| Failure | Recovery |
|---------|----------|
| Live tx hangs / devnet slow | `settle()` returns `FALLBACK_TX_SIG`; narrate: *"Network's slow — here's yesterday's confirmed settlement on Explorer"* |
| Devnet entirely down | Same fallback sig; **ledger demo unaffected** — Solana is not on critical path |
| Faucet rate-limited on stage | **Never faucet on stage** — run setup night before; self-minted token avoids USDC faucet |
| Missing `.env.local` | Panel shows fallback sig only; fix env between runs |
| Setup script fails | Use teammate's pre-generated `.env.local`; do not block Phase 2 demo |
| Behind schedule | Ship panel + fallback only; skip auto-fire after tip; one manual "Settle" click in demo script |

**Demo-day insurance stack** (from [`../buildplan.md`](../buildplan.md) §7):

1. `FALLBACK_TX_SIG` is a **real confirmed** devnet tx — link always works for judges
2. Ledger + simulate taps = full demo without Solana
3. Wrong mint / empty treasury → fallback path, not a red error screen

---

## Reference

- Full spec: [`../buildplan.md`](../buildplan.md) § Phase 4, §8 `.env.local`, §9 setup commands
- PRD on-chain criterion: [`../prd.md`](../prd.md) — success criteria #2
- Contracts: [`./contracts.md`](./contracts.md) — Solana settle contract
- Team parallelization: [`./team-split.md`](./team-split.md) — Person C track
