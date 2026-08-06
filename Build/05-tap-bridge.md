# Phase 5 — Tap bridge (WebSocket)

**Goal:** A tiny local server that turns real reader events into the same `TapEvent` the simulate buttons already produce. The UI subscribes over WebSocket; hardware and simulate paths share `handleTap(uid)`.

| | |
|---|---|
| **Owner** | Optional track — Person D or anyone **not** the integrator (Person A) |
| **Depends on** | Phase 2 complete (`handleTap`, `SimulateBar`, simulate-only `tapSource.ts`) |
| **Estimated time** | 30–45 min |
| **Required** | **No — OPTIONAL.** Only start if simulate demo passes 2 clean runs **and** ≥45 min remain before freeze. Skip entirely if behind schedule. |

> **Conditional gate:** Do not begin Phase 5 until Phases 1–4 are done and Phase 7 rehearsal is not yet urgent. The demo is fully shippable without this phase.

---

## Files to create / modify

```
bridge/
  server.js              # WS server + HTTP POST /tap ingress
lib/
  tapSource.ts           # add WS subscription; simulate path unchanged
.env.local               # NEXT_PUBLIC_BRIDGE_URL=ws://localhost:7071 (already in template)
package.json             # ensure `ws` dep present
```

**Do not touch:** `handleTap`, ledger ops, Solana settle, or component logic. Bridge only delivers UIDs.

---

## Contracts this phase must honor

From [`contracts.md`](contracts.md):

**HTTP ingress:**

```
POST http://localhost:7071/tap
Content-Type: application/json

{ "uid": "MARIA_CARD", "source": "esp32" | "reader" | "sim" }
```

**WebSocket broadcast to UI:**

```json
{ "type": "tap", "uid": "MARIA_CARD", "source": "sim", "ts": 1690000000000 }
```

**UI rule:** On WS `tap` message → call the same `handleTap(uid)` used by `SimulateBar`. Nothing downstream inspects `source`.

---

## Step-by-step tasks

- [ ] Confirm **simulate-only demo works** with bridge **not** running (Phases 1–4 acceptance)
- [ ] Install `ws` if not already: `npm i ws`
- [ ] Create `bridge/server.js`:
  - [ ] WebSocket server on port **7071** (or `process.env.BRIDGE_PORT`)
  - [ ] Broadcast `{ type: "tap", uid, source, ts }` to all connected clients on each tap
  - [ ] HTTP `POST /tap` accepting JSON `{ uid, source? }` — default `source` to `"esp32"` or `"reader"` based on caller
  - [ ] Log every tap to console (`[bridge] tap uid=… source=…`)
  - [ ] Handle CORS or allow localhost only (demo scope)
- [ ] Update `lib/tapSource.ts`:
  - [ ] Read `NEXT_PUBLIC_BRIDGE_URL` (default `ws://localhost:7071`)
  - [ ] On mount, open WebSocket; on `tap` message, call registered `onTap(uid)` / `handleTap`
  - [ ] Reconnect with backoff if connection drops (optional, keep simple)
  - [ ] **Simulate buttons must still call `handleTap` directly** — never require bridge to be online
- [ ] Add npm script (optional): `"bridge": "node bridge/server.js"`
- [ ] Smoke test with curl (bridge running, app open):

```bash
node bridge/server.js &
curl -X POST http://localhost:7071/tap \
  -H 'Content-Type: application/json' \
  -d '{"uid":"MARIA_CARD","source":"reader"}'
# → UI should behave identically to "Simulate: Maria taps"
```

- [ ] Verify simulate buttons still work with bridge **stopped**

---

## Acceptance tests

| # | Test | Expected |
|---|---|---|
| 1 | Bridge offline, simulate tap | Demo works unchanged (Phases 1–4 floor) |
| 2 | Bridge running, `curl POST /tap` with `MARIA_CARD` in Spend mode | Balances match simulate button (maria 10, tacostand 40 after $40 spend) |
| 3 | Bridge running, simulate button | Still works; no double-fire or race |
| 4 | Invalid / unknown UID via curl | UI ignores or shows benign no-op (no crash) |
| 5 | Console | Every tap logged with uid + source |

**Pass criteria:** Hardware path and simulate path are indistinguishable in the UI. Bridge is additive, not required.

---

## Paste-ready agent prompt

```
Create bridge/server.js for the Loop payments demo: a Node process using `ws` that (a) runs a WebSocket server on :7071 broadcasting `{type:'tap',uid,source,ts}` to all connected UIs, and (b) runs an HTTP endpoint POST /tap {uid,source} that ingests taps from an ESP32 or curl and rebroadcasts them over the WS. Update lib/tapSource.ts so the UI opens a WebSocket to ws://localhost:7071 (from NEXT_PUBLIC_BRIDGE_URL), and on a `tap` message calls the same handleTap(uid) used by the simulate buttons. Simulate buttons must keep working with the bridge offline. Log every tap to console. Do not change ledger logic or handleTap behavior — only add the transport layer. Honor the TapEvent contract in Build/contracts.md.
```

---

## Fallback if blocked

| Blocker | Fallback |
|---|---|
| Port 7071 in use | Change port in `.env.local` + server; update `NEXT_PUBLIC_BRIDGE_URL` |
| WS won't connect from browser | Check Next.js dev server origin; use `localhost` not `127.0.0.1` mismatch |
| Double taps from bridge | Debounce in bridge (ignore same uid within 500ms) |
| Any bridge issue on demo day | **Stop bridge.** Use simulate buttons or `?sim=1`. Identical demo. |
| Behind schedule | **Skip Phase 5 entirely.** Not judged separately; simulate is the committed path per PRD. |

---

## Demo-day notes

- Start bridge only when physical reader is ready: `node bridge/server.js` in a second terminal alongside `npm run dev`.
- If bridge crashes mid-rehearsal, unplug reader mentally — simulate buttons are the insurance policy.
- Phase 6 (physical reader) depends on this bridge; if Phase 5 fails, skip Phase 6 too.

---

## Next phase

→ [`06-physical-reader.md`](06-physical-reader.md) — **optional**, only if Phase 5 passes and hardware is on hand
