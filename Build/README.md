# Build — Ship Night

Stage-by-stage build plans for the Loop tap-payment demo. Each phase is a self-contained markdown file with files to create, acceptance tests, and a paste-ready agent prompt.

**Phases 1–4 + 7 are required.** Phases 5–6 (bridge + hardware) are optional — skip if behind schedule.

---

## Build order

| Order | Phase | File | Required | Blocks |
|-------|-------|------|----------|--------|
| 0 | Project setup | [00-setup.md](./00-setup.md) | Yes | Everything |
| — | Shared contracts | [contracts.md](./contracts.md) | Yes | Parallel work after Phase 1 |
| 1 | Ledger core | [phase-01-ledger.md](./phase-01-ledger.md) | Yes | Phases 2–4 |
| 2 | Dashboard + simulate taps | [phase-02-dashboard.md](./phase-02-dashboard.md) | Yes | Phase 3, 7 |
| 3 | Split animation + fee line | [phase-03-visuals.md](./phase-03-visuals.md) | Yes | — |
| 4 | Solana devnet tx | [phase-04-solana.md](./phase-04-solana.md) | Yes | — |
| 7 | Polish + rehearsal | [phase-07-polish.md](./phase-07-polish.md) | Yes | Submit |
| 5 | Tap bridge (WebSocket) | [phase-05-bridge.md](./phase-05-bridge.md) | **Optional** | Phase 6 |
| 6 | Physical reader | [phase-06-hardware.md](./phase-06-hardware.md) | **Optional** | — |

---

## Team split

See [team-split.md](./team-split.md) for role assignments, parallel tracks, and merge order.

---

## Night timeline

| Time | Phases |
|------|--------|
| 4:00 | [00-setup.md](./00-setup.md) — clone, `npm i`, `next dev` |
| 5:00–5:20 | Submit PRD ([../prd.md](../prd.md)) |
| 5:20–6:30 | **Phase 1 + 2** → shippable demo (simulate only) |
| 6:30–7:30 | Phase 3 + Phase 4 |
| 7:30–8:30 | Phase 5 + 6 **only if ahead** |
| 8:30–9:15 | Phase 7 — rehearse twice (once unplugged) |
| 9:15–9:30 | Freeze and submit |

---

## Architectural principle

> A tap is just a UID string at `handleTap(uid)`. Simulate buttons, WebSocket bridge, and physical readers all call the same handler.

Build Phase 2 first. The demo is fully winnable with simulate buttons alone.

---

## Fallbacks (demo day)

1. Reader dies → simulate button (identical demo)
2. Bridge won't start → simulate buttons; use `?sim=1`
3. Solana tx fails → `FALLBACK_TX_SIG` still links to real Explorer tx
4. Devnet down → ledger demo unaffected; fallback sig still works
5. ESP32 WiFi blocked → phone hotspot or simulate

---

## Reference docs

- Full build plan: [../buildplan.md](../buildplan.md)
- PRD: [../prd.md](../prd.md)
