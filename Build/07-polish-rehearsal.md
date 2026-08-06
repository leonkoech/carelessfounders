# Phase 7 — Polish, rehearsal mode, fallbacks

**Goal:** Demo is stage-ready: reset between runs, guaranteed simulate-only rehearsal path, big-screen legibility, and two full run-throughs (one with reader unplugged). Freeze before 9:30 submit.

| | |
|---|---|
| **Owner** | Person D (QA / demo) + Person B (UI legibility); integrator (A) wires reset API |
| **Depends on** | Phases 1–4 complete (minimum). Phases 5–6 optional — rehearsal must pass **without** hardware. |
| **Estimated time** | 45 min (8:30–9:15 window) |
| **Required** | **Yes — do not skip.** Success criteria in PRD include ≤3 min run and reader-failure survival. |

---

## Files to create / modify

```
lib/
  ledger.ts              # add reset() → re-seed SEED_ACCOUNTS
  tapSource.ts           # ?sim=1 forces simulate-only; ignore bridge WS
app/
  page.tsx               # Reset button, ?sim=1 handling, keyboard shortcut (optional)
  api/reset/route.ts     # POST → ledger.reset() (optional if client-side reset OK)
components/
  AccountCard.tsx        # balance size / contrast for projection (if needed)
  FeeLine.tsx            # legibility pass
  SolanaPanel.tsx        # Explorer link visible from back of room
  SimulateBar.tsx        # prominent when ?sim=1 or rehearsal mode
```

---

## Step-by-step tasks

### Rehearsal mode (`?sim=1`)

- [ ] On load, if URL contains `?sim=1` (or `rehearsal=1`):
  - [ ] Do **not** open WebSocket to bridge — simulate-only
  - [ ] Show subtle banner: "Rehearsal mode — simulate taps only"
  - [ ] `SimulateBar` remains fully functional
- [ ] Optional: keyboard shortcut (e.g. `R` or `Shift+S`) toggles same behavior without URL change
- [ ] Verify: bridge can be running but UI ignores it in `?sim=1`

### Reset button

- [ ] Implement `ledger.reset()` per [`contracts.md`](contracts.md) — restore `SEED_ACCOUNTS` balances
- [ ] Add visible **Reset demo** control (confirm dialog optional — keep one click for speed)
- [ ] Reset clears terminal "waiting" state and any transient animations
- [ ] Reset does **not** clear Solana panel last sig (OK to keep — or reset that too; pick one, document)
- [ ] After reset: customer 1000, restaurant 0, maria 0, tacostand 0, agent 5000

### Tap order & narration script

- [ ] Lock demo script numbers everywhere: **$250 bill, $50 tip, $40 spend** ([`contracts.md`](contracts.md))
- [ ] Confirm Maria UID works for: (1) tip credit, (2) balance reveal tap, (3) spend at Taco Stand
- [ ] Write 3-minute narration aligned with PRD honesty guardrails:
  - "Read the card as identity" — not "charged the card"
  - "Stablecoin-style SPL token on Solana devnet" — not "Circle USDC on mainnet"
  - Fee comparison: ~$0.01 vs Square ~$1.14, inside the loop
- [ ] Optional Beat 4 (cash-out at agent): only if implemented and rehearsed — not committed

### Big-screen check

- [ ] Project or fullscreen at demo resolution; stand **10 ft back**
- [ ] Account balances: large, high contrast, animate on change (count-up + flash)
- [ ] Split animation readable in peripheral vision
- [ ] Fee line: `Our fee: $0.01` vs Square struck through, larger/red
- [ ] Solana Explorer link legible; test click opens correct devnet tx
- [ ] No tiny gray text; bump Tailwind text sizes if needed (`text-4xl`, `text-5xl` for balances)

### Rehearse twice (mandatory)

**Run 1 — Happy path (reader if available):**

1. Reset demo
2. Terminal: Charge Bill — $250 total, $50 tip
3. Customer tap (physical or simulate)
4. Confirm split animation + balances 750 / 200 / 50
5. Trigger on-chain settle (if auto or manual) — Explorer link works
6. Terminal: Spend — $40
7. Maria tap
8. Confirm fee line + balances 10 / 40
9. Time the run — target **≤3 minutes**

**Run 2 — Failure path (reader unplugged / `?sim=1`):**

1. Open app with `?sim=1` OR unplug reader / stop bridge
2. Repeat full script using **simulate buttons only**
3. Confirm demo is **identical** to Run 1 from audience perspective
4. If Solana fails live, confirm fallback sig still shows real Explorer tx

- [ ] Both runs logged; fix any stumble before 9:15 freeze

---

## Acceptance tests

| # | Test | Expected |
|---|---|---|
| 1 | Reset → tap through full demo | Clean state; no stale balances |
| 2 | `?sim=1` with bridge running | No WS taps applied; simulate only |
| 3 | Full demo ≤3 min | Narrator + operator comfortable |
| 4 | Unplugged run #2 | Identical outcome via simulate |
| 5 | 10-ft legibility | Balances, fee line, Explorer link readable |
| 6 | Solana fallback | Kill network or force error → `FALLBACK_TX_SIG` link works |

**Pass criteria:** Team confident presenting with reader **or** simulate-only. No code edits after 9:15 except critical show-stopper.

---

## Paste-ready agent prompt

```
Polish the Loop demo for stage readiness. (1) Add ledger.reset() that re-seeds SEED_ACCOUNTS and expose a Reset demo button on the dashboard. (2) Support ?sim=1 URL param: skip WebSocket bridge connection, show a rehearsal banner, keep SimulateBar fully working. (3) Ensure balances, FeeLine, and SolanaPanel Explorer link are legible at projection size — bump Tailwind font sizes/contrast. (4) Do not change handleTap logic or ledger math. Honor reset() in Build/contracts.md. Rehearsal mode must guarantee simulate-only even if bridge/server.js is running.
```

---

## Fallback if blocked

| Blocker | Fallback |
|---|---|
| Reset breaks state | Hard refresh browser (`Cmd+R`); restart `next dev` re-seeds ledger |
| `?sim=1` not working | Stop bridge; simulate buttons don't need bridge anyway |
| Text still too small | Manual CSS bump on `AccountCard` only — don't refactor layout |
| Rehearsal over 3 min | Cut narration; pre-fill terminal amounts before going on stage |
| Last-minute bug | Revert to last known good simulate run; use `?sim=1` on stage |

---

## Demo-day insurance stack (everyone knows)

| Failure | One-action recovery |
|---|---|
| Reader dies | Click simulate button |
| Bridge won't start | `?sim=1` or simulate buttons |
| Solana tx hangs | Fallback sig still links to real confirmed tx |
| Devnet down | Ledger demo unaffected; show fallback Explorer link |
| ESP32 WiFi blocked | Phone hotspot or simulate |

---

## Freeze checklist (9:15)

- [ ] No uncommitted WIP on `main` / demo branch
- [ ] `.env.local` has `FALLBACK_TX_SIG` from night-before setup
- [ ] Submit before hard cutoff — **do not edit at 9:29**
- [ ] Laptop: `npm run dev` command ready; bridge command ready only if using hardware
- [ ] Backup plan: demo URL with `?sim=1` bookmarked

---

## Reference

- PRD success criteria: [`../prd.md`](../prd.md)
- Full timeline: [`../buildplan.md`](../buildplan.md) §6
- Team roles: [`team-split.md`](team-split.md)
