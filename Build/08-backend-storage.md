# Backend & data storage plan

**Loop · Ship Night**

How to evolve from today's in-memory prototype to a proper backend — without breaking the demo or the frozen contracts in [`contracts.md`](./contracts.md).

---

## Executive recommendation

| When | Storage | Why |
|------|---------|-----|
| **Tonight (demo)** | Server in-memory ledger behind API routes | Matches PRD OUT scope; zero setup; most reliable on stage |
| **Next week (prototype+)** | **SQLite event log** | Persists between restarts; audit trail; still one repo, no cloud |
| **Product (later)** | Postgres (Supabase) + optional chain index | Multi-user, auth, ops, backups |

**Do not add a database tonight** unless you are clearly ahead of schedule and have already passed the Phase 2 simulate demo checkpoint. A DB is a new failure surface on stage.

---

## Architectural principle (unchanged)

```
Tap (UID) → handleTap(uid) → ledger operation → persist (optional) → broadcast state
```

The UI, bridge, and hardware never talk to the database directly. They call the same ledger API. Storage is an implementation detail behind `lib/ledger.ts`.

---

## What to store

### Tier 1 — Demo minimum (in-memory)

Enough to run the dashboard. No persistence.

| Entity | Fields | Notes |
|--------|--------|-------|
| **Account** | id, name, role, balance, uid? | Seed from `SEED_ACCOUNTS` |
| **UID map** | uid → account_id | In code or env for demo |

Operations: `payBill`, `spend`, `cashOut`, `getState`, `reset`.

### Tier 2 — Prototype+ (SQLite event log)

Append-only ledger. Balances are derived or cached.

| Table | Purpose |
|-------|---------|
| `accounts` | id, name, role, uid, balance (cache) |
| `transactions` | id, type, from_id, to_id, amount, tip, metadata JSON, created_at |
| `tap_events` | uid, source, account_id, mode, created_at |
| `settlements` | tx_sig, amount, fallback, created_at |

Transaction types: `pay_bill`, `spend`, `cash_out`, `reset`.

### Tier 3 — Product (Postgres)

Add: users, sessions, merchants, workers, card_uids, reconciliation jobs, webhooks.

---

## Data model (Tier 2 — recommended next step)

```sql
-- accounts (cached balances; updated in same TX as insert)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NOT NULL,
  uid TEXT UNIQUE,
  balance REAL NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

-- immutable event log
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- pay_bill | spend | cash_out | reset
  payload JSON NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- tap audit (debugging + demo narration)
CREATE TABLE tap_events (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  source TEXT NOT NULL,  -- sim | reader | esp32
  account_id TEXT,
  terminal_mode TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Solana settlement records (Phase 4)
CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  sig TEXT NOT NULL,
  fallback INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Invariant:** Every balance change happens inside a DB transaction: insert into `transactions` + update `accounts`. Never update balances without a matching transaction row.

---

## API design (frozen surface for frontend)

Keep the same contract as [`contracts.md`](./contracts.md). Add thin HTTP layer:

```
GET  /api/ledger          → { accounts: Account[] }
POST /api/ledger/tap      → { uid, mode, total?, tip?, amount? } → operation result + accounts
POST /api/ledger/reset    → { accounts: Account[] }
POST /api/settle          → { sig, fallback }   (Phase 4, already planned)
```

Optional realtime (Phase 5+):

```
WS   /api/ledger/stream   → { type: "state", accounts } | { type: "tap", ... }
```

The dashboard stops importing ledger directly; it fetches state and posts taps.

---

## Implementation phases

### Phase B0 — Server ledger (no DB) · ~45 min

**When:** After Phase 2 UI works; can parallel Phase 4 Solana.

| Task | File |
|------|------|
| Move ledger singleton to server-only module | `lib/ledger.ts` |
| GET full state | `app/api/ledger/route.ts` |
| POST tap operations | `app/api/ledger/tap/route.ts` |
| POST reset | `app/api/ledger/reset/route.ts` |
| Update dashboard to fetch/post | `app/page.tsx` |

**Acceptance:** Two browser tabs show the same balances after a tap. Server restart resets state (expected).

**Owner:** Person A (integrator).

---

### Phase B1 — SQLite persistence · ~90 min

**When:** After demo ships OR post-hackathon.

| Task | File |
|------|------|
| Schema + migrations | `lib/db/schema.sql`, `lib/db/migrate.ts` |
| DB client | `lib/db/client.ts` (better-sqlite3 or `@libsql/client`) |
| Event-sourced ledger adapter | `lib/ledger.sqlite.ts` implementing same signatures |
| Swap import in API routes | one-line change per route |
| Seed on first run | `scripts/db-seed.ts` |

**Acceptance:** Restart server → balances survive. `reset` restores seed. Transaction history queryable.

**Owner:** Backend person or Person A.

---

### Phase B2 — Realtime + bridge · ~60 min

**When:** Phase 5 bridge or multi-screen demo.

| Task | Notes |
|------|-------|
| Broadcast state after each operation | SSE or WebSocket from Next or bridge |
| Bridge POST `/tap` → API `/api/ledger/tap` | Single code path |
| Log every tap to `tap_events` | SQLite only |

**Acceptance:** curl tap + simulate button + second browser all stay in sync.

---

### Phase B3 — Product hardening (later)

- Postgres migration from SQLite
- Auth (merchant vs worker vs admin)
- Idempotency keys on taps (prevent double-charge)
- Reconciliation: ledger vs Solana settlements
- Backups, monitoring, rate limits

---

## Team split

| Person | Phase | Delivers |
|--------|-------|----------|
| **A** | B0 | API routes + wire dashboard |
| **C** | B0 + B1 | SQLite schema + ledger adapter (post-demo) |
| **B** | — | UI unchanged if API matches contracts |
| **D** | B2 | Realtime broadcast + bridge integration |

**Parallel rule:** B0 API shapes must match `contracts.md` before B1 starts. B1 swaps implementation, not API.

---

## What NOT to build (yet)

- User login / KYC / card issuance
- Per-user Solana wallets
- Postgres on demo night
- Redis (unnecessary at this scale)
- GraphQL (REST is enough)
- Storing balances only in localStorage (breaks multi-tab + bridge)

---

## Demo-day fallback

If API or DB fails on stage:

1. Revert dashboard to client-side `@/lib/prototype` imports (keep a git tag `demo-client-only`)
2. Simulate buttons still work
3. Solana settle stays isolated with `FALLBACK_TX_SIG`

Tag before switching: `git tag demo-client-fallback`.

---

## Environment variables

```env
# B0 — none required

# B1 — SQLite
DATABASE_URL=file:./data/loop.db

# B3 — Postgres
DATABASE_URL=postgresql://...

# Phase 4 (unchanged)
TREASURY_SECRET=...
FALLBACK_TX_SIG=...
```

---

## Decision log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Demo storage | In-memory server | PRD scope; fastest; no ops |
| First persistent store | SQLite event log | Correct ledger pattern; local file; easy migration to Postgres |
| Not Supabase tonight | Explicit OUT | Setup + network = stage risk |
| Source of truth | Off-chain ledger | Solana is proof/settlement, not balance book (for demo) |

---

## Paste-ready agent prompt (Phase B0)

```
Implement server-side ledger API for Loop demo. Do NOT add a database.

Create lib/ledger.ts (server singleton) with payBill, spend, cashOut, getState, reset per Build/contracts.md.

Create:
- GET app/api/ledger/route.ts → { accounts }
- POST app/api/ledger/tap/route.ts → body { uid, mode, total?, tip?, amount? }; resolve UID via UID_MAP; apply operation; return { result, accounts }
- POST app/api/ledger/reset/route.ts → reset + return accounts

Update app/page.tsx to fetch GET /api/ledger on load and after each tap POST /api/ledger/tap. Remove direct lib/prototype ledger imports from the client.

Simulate buttons and handleTap behavior must be unchanged. TypeScript strict.
```

---

## Next step

**If still on hackathon clock:** implement **Phase B0 only** (server in-memory API). Skip SQLite until after submit.

**If demo is done:** implement **Phase B1** (SQLite) so rehearsals persist state and you have a transaction history for judges Q&A.
