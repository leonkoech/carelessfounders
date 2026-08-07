# Loop — Ship Night app

Next.js app for the Loop tap-payment demo (landing, login, portal, APIs).

See the [repo root README](../README.md) for setup, demo credentials, architecture, and docs.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Landing: `/`
- Login: `/login` (`demo@loop.app` / `loopdemo`)
- Portal: `/portal`

Copy `.env.example` → `.env.local` for Firebase / Solana. Without env vars, the ledger falls back to in-memory mode.
