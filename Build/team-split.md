# Team split guide

How to parallelize Ship Night across **2–4 people**. Hardware and WebSocket (Phases 5–6) are **last and optional** — skip if behind schedule.

**Index:** [`README.md`](README.md) · **Contracts:** [`contracts.md`](contracts.md) · **PRD:** [`../prd.md`](../prd.md)

**Time estimate:** Read 10 min; applies all night

---

## Goal

Maximize parallel work after Phase 1 without merge conflicts. Everyone knows their lane, merge order, and when to skip optional hardware.

---

## The one rule

Only **Phase 1 (ledger)** blocks everyone. Once `lib/ledger.ts` matches [`contracts.md`](contracts.md), split into parallel tracks. Person A owns `handleTap(uid)` — single integration point.

---

## Roles by team size

### 4 people (ideal)

| Person | Role | Phases | Owns | Time |
|--------|------|--------|------|------|
| **A** | Core / integrator | 00 → 01 → 02 → merge | `lib/ledger.ts`, `handleTap`, `app/page.tsx`, API routes | 5:20–7:00 |
| **B** | UI / stage | 02 → 03 → 07 | `AccountCard`, `Terminal`, `SimulateBar`, `SplitAnimation`, `FeeLine` | 6:00–8:30 |
| **C** | Chain | 04 | `scripts/solana-setup.ts`, `lib/solana.ts`, `SolanaPanel`, `/api/settle` | 6:30–7:30 |
| **D** | Demo / QA | 07 + testing | Reset, rehearsal, run-through, narration, big-screen check | 8:30–9:15 |

**Optional last (one person, not A):** Phase 5 bridge + Phase 6 reader — only if gates below pass.

### 3 people

| Person | Phases | Time |
|--------|--------|------|
| A | 01 → 02 (integrator) | 5:20–6:45 |
| B | 02 UI → 03 → 07 polish | 6:00–8:45 |
| C | 04 Solana + QA | 6:30–9:00 |

Skip hardware unless ≥45 min remain after Phase 7 rehearsal.

### 2 people

| Person | Phases | Time |
|--------|--------|------|
| A | 00 → 01 → 02 → integrate | 5:20–7:30 |
| B | Wait for ledger → 03 + 04 + 07 | 6:30–9:00 |

Hardware: skip unless both agree after a clean simulate-only run-through.

---

## Parallel timeline (from 5:20 PRD lock)

| When | Person A | Person B | Person C | Person D |
|------|----------|----------|----------|----------|
| **5:20–6:00** | Phase 1 ledger | Scaffold empty components | Read Phase 4 plan; verify `.env.local` | Submit PRD, prep demo script |
| **6:00–6:30** | Phase 2 tap handler + API | Build `AccountCard`, `Terminal`, `SimulateBar` | Run `solana-setup.ts` (night before ideally) | Test ledger math vs contracts |
| **6:30** | **CHECKPOINT: simulate demo works** | | | |
| **6:30–7:30** | Integrate B's components | Phase 3 split + fee line | Phase 4 settle + `SolanaPanel` | Rehearse tap order (Maria triple duty) |
| **7:30–8:30** | Phase 7 reset + `?sim=1` | Big-screen legibility pass | Explorer link check | Full run ×2 unplugged |
| **8:30–9:15** | Freeze or assist | Freeze or assist | Freeze | **Optional:** Phase 5–6 (one person) |
| **9:15–9:30** | **FREEZE — submit** | | | |

---

## Tasks by role

### Person A — Integrator

1. Complete [phase-01-ledger.md](./phase-01-ledger.md) per contracts
2. Implement `handleTap(uid)` and terminal mode routing
3. Wire ledger via `/api/*` routes or direct imports
4. Merge all component PRs into `app/page.tsx`
5. Add reset + `?sim=1` in Phase 7

### Person B — UI / stage

1. Build `AccountCard` with count-up + flash on balance change
2. Build `Terminal` with mode selector + "Waiting for tap…"
3. Build `SimulateBar` — one button per UID account
4. Phase 3: `SplitAnimation`, `FeeLine`
5. Verify legibility at 10 ft projection

### Person C — Chain

1. Create `scripts/solana-setup.ts` (night before)
2. Implement `lib/solana.ts` with fallback sig
3. Expose `POST /api/settle`
4. Build `SolanaPanel` with Explorer link
5. Confirm settle never blocks tap flow

### Person D — QA / demo

1. Submit PRD by 5:20
2. Maintain demo script (bill → tip → spend → settle)
3. Run acceptance tests after each checkpoint
4. Rehearse twice — once with reader unplugged
5. Own narration + honesty guardrails from PRD

---

## What to split vs. not split

**Split freely (low conflict):**
- `components/*` → Person B
- `lib/solana.ts`, `scripts/solana-setup.ts`, `SolanaPanel.tsx` → Person C
- `bridge/*` → optional track, one person at end

**Single owner only:**
- `handleTap(uid)` → Person A
- `lib/accounts.ts` seed + `UID_MAP` → Person A (Phase 1); read-only after
- `app/page.tsx` integration → Person A merges; others PR component files

---

## Branch strategy

```
main
├── feat/ledger      (A — merge first)
├── feat/dashboard   (A + B)
├── feat/ui-visuals  (B — after dashboard)
├── feat/solana      (C — after ledger)
└── feat/bridge      (optional — last)
```

**Merge order:** `ledger` → `dashboard` → `ui-visuals` + `solana` (parallel) → `polish` → `bridge` (if at all).

**Sync every 45 min** at: (1) ledger done, (2) simulate demo works, (3) before optional hardware.

---

## Optional hardware gates

Proceed to Phase 5–6 only if **all** are true:

- [ ] Simulate-only demo passes 2 clean run-throughs
- [ ] ≥45 minutes left before 9:15 freeze
- [ ] One dedicated person (not the integrator)
- [ ] Phone hotspot ready if using ESP32

If any gate fails → **skip**. Judges see identical demo via simulate buttons.

---

## Acceptance tests (team-level)

| Checkpoint | Test | Owner |
|------------|------|-------|
| After Phase 1 | Ledger math matches contracts acceptance tests | A + D |
| After Phase 2 | Simulate customer tap → 750/200/50; Maria spend → 10/40 | A |
| After Phase 3 | Split animation + fee line readable from 10 ft | B + D |
| After Phase 4 | Settle returns devnet sig or fallback; Explorer link works | C |
| Before submit | Full demo ≤3 min; reset works; rehearsed unplugged | D |
| Optional 5–6 | `curl POST /tap` moves money same as simulate button | whoever |

---

## Done definitions per role

| Role | Done when |
|------|-----------|
| A | Customer simulate tap → 750/200/50; Maria spend tap → 10/40; reset works |
| B | Balances animate; split + fee readable from 10 ft |
| C | Settle returns devnet sig or fallback; Explorer link works |
| D | Full demo ≤3 min; rehearsed with reader unplugged; PRD submitted |

---

## Insurance stack (everyone should know)

| Failure | One-action recovery |
|---------|---------------------|
| Reader dies | Click simulate button |
| Bridge won't start | `?sim=1` or simulate buttons (no bridge needed) |
| Solana tx fails | `FALLBACK_TX_SIG` still links to real confirmed tx |
| Devnet down | Ledger demo unaffected; show fallback Explorer link |
| ESP32 WiFi blocked | Phone hotspot or simulate |

---

## Agent prompts by role

### Person A (integrator)

> You own integration. Implement Phase 1 ledger per `Build/contracts.md`, then Phase 2 dashboard with `handleTap(uid)` as the single tap entry point. Wire terminal modes (charge/spend/cashout) to ledger ops. Merge component files from Person B into `app/page.tsx`. Add API routes if needed. Simulate buttons must work with no bridge. Do not implement Solana or bridge — stub imports only if needed for compile.

### Person B (UI)

> Build presentation components for the Loop demo: `AccountCard` (big balances, count-up animation), `Terminal` (mode selector, amount/tip inputs, waiting state), `SimulateBar` (one button per UID account calling `handleTap`). Phase 3: add `SplitAnimation` ($250 → $200 + $50) and `FeeLine` ($0.01 vs Square struck-through). Export components; Person A integrates. Tailwind, stage-legible. Do not change ledger signatures.

### Person C (chain)

> Implement Phase 4 Solana isolation per `Build/contracts.md`. Create `scripts/solana-setup.ts` (run night before), `lib/solana.ts` with `settle()` and fallback to `FALLBACK_TX_SIG`, `POST /api/settle`, and `SolanaPanel` with devnet Explorer link. Settle must never block tap flow. Self-minted SPL token on devnet — not mainnet USDC.

### Person D (optional hardware — last)

> Only if team passes hardware gates. Create `bridge/server.js` (WS on :7071 + HTTP POST /tap). Update `lib/tapSource.ts` to subscribe to bridge WS while keeping simulate buttons working offline. Optionally add `bridge/acr122u.js` or ESP32 POST. Map real UIDs into `UID_MAP`. One physical tap = one event (debounce).
