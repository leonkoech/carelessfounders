# PRD — Loop

*(Swap the name if you land on another — Tapline / Relay / Circa all work.)*

## One-liner
Instant, near-zero-fee stablecoin rails for the cash economy. Tap a card, money moves person-to-person in seconds, settled on Solana — no bank in the loop.

## Problem
A tipped worker is paid days after they earn, through a bank they may not have, minus a cut at every step. Card processors (Square, Stripe) move money *into* a business's bank account and stop — they can't pay the worker, and they can't move value onward without another 2–3% fee. Millions of underbanked workers are stuck between "instant but expensive" cards and "cheap but slow" bank transfers.

## Solution
A closed-loop payment network where dollars enter once and circulate — customer → merchant → worker → next merchant — as a stablecoin, with no card network or bank touched *after entry*. Because no card rail is involved on the internal hops, each transfer costs ~$0.01 instead of ~3%. A tap card is the interface; the balance lives in the ledger; the money settles on-chain.

## What we'll show live (the demo)
1. A $250 restaurant bill ($200 food + $50 tip) paid with one tap.
2. The tip **auto-splits**: $200 to the restaurant, $50 routed instantly to the worker's card.
3. The worker's tip lands on her card in seconds — no bank, no waiting two weeks.
4. **One real Solana devnet transaction** settles on-chain; signature shown live on Solana Explorer.
5. The worker spends $40 at a second merchant by tapping the same card — fee **$0.01 vs Square ~$1.14** (shown, struck through).

## Scope — IN (committed for tonight)
- Live dashboard showing all account balances updating in real time.
- Bill payment with embedded tip that auto-splits to the worker.
- In-network worker→merchant spend with the fee comparison on screen.
- One real Solana devnet SPL transfer with an Explorer link.
- Tap-driven interaction (physical tap if hardware permits; simulated tap as the guaranteed path — identical behavior).

## Scope — OUT (explicitly not built)
- No real card charging or Visa/Mastercard acceptance — we read a card's UID as **identity only**, never process a card payment.
- No bank off-ramp, card issuance, KYC, or user auth.
- No production wallets or per-user key custody — a single treasury wallet on devnet.
- No persistent database — in-memory ledger that resets between runs.

## Stretch (only if ahead of schedule — not committed)
- Physical NFC reader (ESP32 + PN532) as the tap source instead of the simulate button.
- **Agent cash-out** beat: worker taps at a cash agent, balance → $0, "cash handed" — closing the paid-spent-cashed-out loop with no bank at any step.

## Tech
Next.js + TypeScript, in-memory ledger, native WebSocket tap bridge (hardware-agnostic), Solana devnet via @solana/web3.js + @solana/spl-token. Built in Cursor.

## Why it wins
- **Real on-chain, live** — a genuine Solana devnet settlement confirming in front of the room, not a mocked number.
- **The fee kill-shot** — $0.01 vs a card processor's ~$1.14, shown in-product.
- **The physical tap** — real value moving on a card tap, the memorable moment in a no-slides room.
- **A category, not a discount** — Square makes leaving money cheaper; Loop makes leaving unnecessary. The tip reaching the worker instantly is a payment Square structurally cannot make.

## Success criteria (what "done" looks like)
- Bill pays, tip splits, worker's balance updates — live, reliably.
- A real devnet signature resolves on Explorer.
- The fee comparison is legible across the room.
- The full run completes in ≤3 minutes, and survives a reader failure without changing (simulate fallback).

## Honesty guardrails (how we describe it)
- "Read the card as identity," never "charged the card."
- "Stablecoin-style SPL token on Solana devnet," not "Circle USDC on mainnet."
- Zero-fee applies **inside the loop**; the doors in/out pay normal card rates.
- The cash-agent network is a proven model; the licensed buildout is the company, not tonight's demo.