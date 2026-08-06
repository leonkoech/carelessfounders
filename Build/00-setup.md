# Phase 0 — Project setup

**Time estimate:** 20–30 min (everyone, at arrival)  
**Required:** Yes — blocks all other phases  
**Depends on:** Nothing  
**Blocks:** Phases 1–7

---

## Goal

Bootstrap a Next.js + TypeScript repo with dependencies installed, a `.env.local` template in place, and `next dev` running before onboarding ends. No feature code yet — only scaffolding so Phase 1 can start immediately.

---

## Files to create

| Path | Purpose |
|------|---------|
| `ship-night/` (repo root) | Next.js app created via `create-next-app` |
| `.env.local` | Secrets template (paste Solana values from night-before setup) |
| `.env.local.example` | Committed template for the team (no secrets) |
| `package.json` | App + bridge + Solana deps |
| `bridge/` | Empty directory placeholder (Phase 5) |
| `scripts/` | Empty directory placeholder (Phase 4) |

---

## Tasks

1. **Create the Next.js app** (if not already in repo):
   ```bash
   npx create-next-app@latest ship-night --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*"
   cd ship-night
   ```

2. **Install runtime dependencies:**
   ```bash
   npm i @solana/web3.js @solana/spl-token
   ```

3. **Install dev / optional dependencies:**
   ```bash
   npm i -D ws tsx
   npm i nfc-pcsc   # only if using ACR122U reader (Phase 6 Option A)
   ```

4. **Create directory placeholders:**
   ```bash
   mkdir -p bridge scripts lib components app/api
   ```

5. **Write `.env.local.example`** (commit this; never commit real secrets):
   ```env
   # Solana devnet — paste output from: npx tsx scripts/solana-setup.ts (run night before)
   TREASURY_SECRET=
   MINT_ADDRESS=
   RECIPIENT_ADDRESS=
   FALLBACK_TX_SIG=

   # Tap bridge (Phase 5+, optional)
   NEXT_PUBLIC_BRIDGE_URL=ws://localhost:7071
   ```

6. **Copy to `.env.local`** and leave Solana fields blank until Phase 4 (or paste if setup script already ran):
   ```bash
   cp .env.local.example .env.local
   ```

7. **Verify dev server starts:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` — default Next.js page loads.

8. **Optional: add npm scripts** to `package.json`:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "bridge": "node bridge/server.js",
       "solana-setup": "tsx scripts/solana-setup.ts"
     }
   }
   ```

---

## Night-before prep (not tonight — do Wednesday)

Run once before hackathon night so devnet faucet never blocks the demo:

```bash
npx tsx scripts/solana-setup.ts
```

Paste printed values into `.env.local`. Phase 4 agent will create the script; for setup night, stub env vars are fine.

---

## Acceptance tests

- [ ] `npm run dev` starts without errors on port 3000
- [ ] TypeScript + Tailwind + App Router confirmed in `package.json` / file tree
- [ ] `@solana/web3.js` and `@solana/spl-token` in `node_modules`
- [ ] `.env.local.example` exists and is committed; `.env.local` is gitignored
- [ ] `bridge/` and `scripts/` directories exist
- [ ] Default Next.js page loads in browser

---

## Agent prompt

> Bootstrap the Ship Night demo repo. If no Next.js app exists, run `npx create-next-app@latest ship-night --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*"`. Install `@solana/web3.js`, `@solana/spl-token`, dev deps `ws` and `tsx`, and optionally `nfc-pcsc` for ACR122U. Create empty `bridge/` and `scripts/` dirs. Add `.env.local.example` with keys: `TREASURY_SECRET`, `MINT_ADDRESS`, `RECIPIENT_ADDRESS`, `FALLBACK_TX_SIG`, `NEXT_PUBLIC_BRIDGE_URL=ws://localhost:7071`. Copy to `.env.local` (gitignored). Add npm scripts: `bridge` → `node bridge/server.js`, `solana-setup` → `tsx scripts/solana-setup.ts`. Verify `npm run dev` serves localhost:3000. Do NOT implement ledger, UI, or Solana logic — scaffolding only.

---

## What NOT to do

- Do not implement Phase 1+ code in this phase
- Do not commit `.env.local` with real secrets
- Do not add Supabase, Postgres, or auth libraries
- Do not run devnet faucet on demo night — use night-before setup output

---

## Next phase

→ [phase-01-ledger.md](./phase-01-ledger.md) — implement [`contracts.md`](./contracts.md) ledger signatures
