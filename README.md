# Loop

Instant, near-zero-fee stablecoin rails for the cash economy.

Tap a card, money moves person-to-person in seconds, settled on Solana — no bank in the loop after dollars enter once.

## Demo (Ship Night)

1. Customer pays a **$250** restaurant bill (**$200** food + **$50** tip) with one tap
2. Tip **auto-splits** — restaurant gets food, Maria gets tip instantly
3. Maria spends **$40** at the taco stand — fee **~$0.01** vs Square **~$1.14**
4. One real **Solana devnet** SPL transfer settles on-chain (Explorer link in portal)
5. Optional: cash out at the agent / physical NFC reader

Simulate taps work with no hardware. Physical readers are additive.

## Quick start

```bash
git clone https://github.com/leonkoech/carelessfounders.git
cd carelessfounders/ship-night
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | What |
|-------|------|
| `/` | Landing page |
| `/login` | Demo portal login |
| `/portal` | Live tap-payment dashboard |

**Demo credentials**

- Email: `demo@loop.app`
- Password: `loopdemo`

### Optional: Firebase + Solana

Without env vars the app uses an **in-memory ledger** (fine for a single-machine demo).

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_FIREBASE_* for shared Firestore state
# optional: SOLANA_SECRET_KEY for on-chain settlement
```

```bash
npm test                 # ledger unit tests
npm run solana-setup     # mint / fund demo wallets on devnet
npm run bridge           # WebSocket tap bridge (optional hardware)
```

## Repo layout

```
carelessfounders/
├── ship-night/          # Next.js app (landing, login, portal, APIs)
│   ├── app/             # routes: /, /login, /portal, /api/tap|reset|settle|state
│   ├── components/      # landing + portal UI
│   ├── lib/             # ledger, Firestore, Solana, tap source
│   ├── bridge/          # optional WebSocket tap bridge
│   └── scripts/         # Solana setup helpers
├── firmware/            # optional PN532 / reader scripts
├── Build/               # phase-by-phase build plans
├── prd.md               # product requirements
└── buildplan.md         # full agent-executable build plan
```

## Architecture

A tap is just a **UID string** arriving at one handler. Simulate buttons, the WebSocket bridge, and physical readers all hit the same `/api/tap` path — nothing downstream cares where the UID came from.

```
Simulate UI  ─┐
Bridge WS    ─┼→  POST /api/tap  →  ledger (Firestore or memory)
NFC reader   ─┘                         ↓
                                   portal balances update
```

- **Ledger:** Firestore when `NEXT_PUBLIC_FIREBASE_*` is set; otherwise in-memory (`lib/serverLedger.ts`)
- **Settlement:** Solana devnet SPL transfer via `/api/settle`
- **Auth:** cosmetic demo gate only (`sessionStorage`) — not production auth

## Docs

| Doc | Purpose |
|-----|---------|
| [prd.md](./prd.md) | Problem, solution, demo scope |
| [buildplan.md](./buildplan.md) | Full build plan with agent prompts |
| [Build/](./Build/) | Phased plans, contracts, team split |

## Scripts (`ship-night/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Vitest ledger tests |
| `npm run bridge` | Tap bridge WebSocket server |
| `npm run solana-setup` | Devnet wallet / mint setup |
| `npm run reader` | PN532 USB reader → post taps |

## License

Private hackathon / Ship Night project.
