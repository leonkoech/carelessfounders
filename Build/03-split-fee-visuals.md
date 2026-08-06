# Phase 3 — Split animation + fee line

**Ship Night · Loop demo · Required**

The two visual payoffs judges see from the back of the room: the tip splitting off the bill, and the $0.01 vs Square fee kill-shot.

---

## Goal

After a **Charge Bill** tap, animate `$250` visibly splitting into `$200 → Restaurant` and `$50 → Maria`. After a **Spend** tap, show **Our fee: $0.01** beside a struck-through, larger, red **Square: ~$1.14**. Both animations finish in **<1s** and do not block taps or ledger updates.

---

## Owner role

| Team size | Owner |
|-----------|-------|
| 4 people | **Person B — UI / stage** |
| 3 people | Person B (UI → polish track) |
| 2 people | Person B (after Phase 2 checkpoint) |

**Integrator (Person A) merges** wiring in `app/page.tsx`. Do not change `handleTap` logic — only trigger visuals from its existing success path.

---

## Depends on

| Phase | Why |
|-------|-----|
| **[Phase 1 — Ledger](./01-ledger-core.md)** | `payBill` / `spend` return breakdown + fee numbers |
| **[Phase 2 — Dashboard](./02-dashboard-simulate.md)** | `handleTap`, `Terminal`, `AccountCard`, simulate demo working |

**Can start in parallel:** scaffold empty components during Phase 2; wire and test only after the simulate demo checkpoint passes.

**Blocks:** nothing required downstream. Phase 7 polish may tweak timing/colors.

**Does not block:** Phase 4 (Solana) — fully independent track.

---

## Files (exact paths)

| Action | Path |
|--------|------|
| Create | `components/SplitAnimation.tsx` |
| Create | `components/FeeLine.tsx` |
| Modify | `app/page.tsx` — mount both; pass props from tap handler results |

**Do not touch:** `lib/ledger.ts`, `lib/solana.ts`, `handleTap` operation logic, bridge, hardware.

---

## Contracts

Frozen interfaces — see [`contracts.md`](./contracts.md). Phase 3 consumes these only:

```ts
// From payBill result (Charge Bill tap)
{
  merchantCredited: number;  // e.g. 200
  tipCredited: number;       // e.g. 50
  breakdown: { food: number; tip: number };
}

// From spend result (Spend tap)
{
  amount: number;
  ourFee: number;      // 0.01
  squareFee: number;   // squareFee(40) ≈ 1.14
}

// lib/fees.ts — use for display, do not reimplement
import { squareFee, ourFee } from "@/lib/fees";
```

### SplitAnimation props (suggested)

```ts
type SplitAnimationProps = {
  total: number;
  merchantAmount: number;
  tipAmount: number;
  merchantLabel?: string;   // default "Restaurant"
  tipLabel?: string;        // default "Maria"
  onComplete?: () => void;
};
```

### FeeLine props (suggested)

```ts
type FeeLineProps = {
  ourFee: number;
  squareFee: number;
  amount?: number;          // optional context, e.g. spend amount
};
```

Trigger pattern in `page.tsx` (integrator wires; B provides components):

```ts
// After successful Charge Bill via handleTap:
setSplitPayload({ total, merchantAmount, tipAmount });
setShowSplit(true);

// After successful Spend via handleTap:
setFeePayload({ ourFee, squareFee });
setShowFee(true);
```

---

## Tasks

- [ ] Create `components/SplitAnimation.tsx`
  - [ ] Accept `total`, `merchantAmount`, `tipAmount`, optional labels
  - [ ] Animate total splitting into two labelled amounts (motion toward restaurant + Maria cards, or fly-out labels)
  - [ ] Auto-dismiss or fade out within **<1s**
  - [ ] Tailwind; legible at projection scale (large type, high contrast)
- [ ] Create `components/FeeLine.tsx`
  - [ ] Render `Our fee: $0.01` (from `ourFee` prop)
  - [ ] Render `Square: $X.XX` using `squareFee` from spend result — **struck through**, **larger**, **red**
  - [ ] Format currency to 2 decimals (`$1.14`, not `$1.140000`)
- [ ] Wire into `app/page.tsx` (with integrator)
  - [ ] Show `SplitAnimation` only after a successful **Charge Bill** tap
  - [ ] Show `FeeLine` only after a successful **Spend** tap
  - [ ] Clear or replace prior animation state on next tap (no stacked overlays)
- [ ] Use demo constants from [`contracts.md`](./contracts.md): bill `$250`, tip `$50`, spend `$40`
- [ ] Manual check from ~10 ft away (or zoom browser to 150%)

---

## Acceptance tests

Run with **simulate buttons only** (no bridge, no Solana).

### Test 1 — Bill split animation

1. Terminal: **Charge Bill**, total `$250`, tip `$50`
2. Click **Simulate: Customer taps**
3. **Pass if:**
   - Balances → customer `750`, restaurant `200`, Maria `50` (unchanged from Phase 2)
   - Split animation shows `$250` → `$200` (restaurant) + `$50` (Maria)
   - Animation completes in **<1s** and does not block the next tap

### Test 2 — Fee line kill-shot

1. Terminal: **Spend**, amount `$40`
2. Click **Simulate: Maria taps**
3. **Pass if:**
   - Balances → Maria `10`, Taco Stand `40`
   - Fee line shows **Our fee: $0.01**
   - Square fee shows **~$1.14**, struck through, visibly larger and red than the our-fee line
   - Readable without squinting at projection distance

### Test 3 — No interference

1. Run Charge → Spend → Charge again in sequence
2. **Pass if:** only the relevant visual shows per action; no stuck overlays; ledger math still correct

---

## Paste-ready agent prompt

```
Phase 3 — Split animation + fee line (Ship Night / Loop demo)

Read Build/contracts.md and buildplan.md Phase 3. Do NOT change ledger logic or handleTap operations.

Create:
- components/SplitAnimation.tsx
- components/FeeLine.tsx
Wire both into app/page.tsx so they trigger from the existing tap handler success path.

SplitAnimation: on Charge Bill success, animate the bill total splitting into merchantAmount (food) and tipAmount (tip) with labels (default Restaurant / Maria). Use payBill result fields: merchantCredited, tipCredited, breakdown. Snappy animation <1s. Big Tailwind type for stage projection.

FeeLine: on Spend success, show ourFee ($0.01) beside squareFee from spend result. Square line struck-through, larger, red. Import squareFee/ourFee from lib/fees only for consistency — display values come from spend() return. Format as $X.XX.

Demo numbers: $250 bill + $50 tip → 200/50 split; $40 spend → ourFee 0.01, squareFee ≈ 1.14.

Acceptance: simulate Customer tap → split animates; simulate Maria spend → fee contrast readable from 10ft. Must not block handleTap or balance updates.
```

---

## Time estimate

| Segment | Duration |
|---------|----------|
| SplitAnimation component | 25–35 min |
| FeeLine component | 15–20 min |
| page.tsx wiring + polish | 15–20 min |
| **Total** | **~45–60 min** |

Schedule: **6:30–7:15 PM** (after Phase 2 checkpoint), per [`README.md`](./README.md) night timeline.

---

## Fallback

| Failure | Recovery |
|---------|----------|
| Animation janky or over time | Ship static split text: `$250 → $200 Restaurant + $50 Maria` for 2s — demo story intact |
| Fee line unreadable | Bump Square to `text-4xl` red + `line-through`; our fee stays normal weight |
| Merge conflict on `page.tsx` | Export components only; let integrator (Person A) add 5–10 lines of trigger state |
| Behind schedule | **Skip motion** — show split/fee as bold text overlays; Phase 2 demo still wins judges |

**Demo-day insurance:** Phase 2 simulate demo is the floor. Phase 3 is polish on the fee story — cut animation complexity before cutting Phase 4 Solana or Phase 2 reliability.

---

## Reference

- Full spec: [`../buildplan.md`](../buildplan.md) § Phase 3
- PRD demo beats: [`../prd.md`](../prd.md) — tip split + fee comparison
- Contracts: [`./contracts.md`](./contracts.md)
