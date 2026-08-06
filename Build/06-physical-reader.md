# Phase 6 — Physical NFC reader

**Goal:** A real card tap emits a UID into the bridge, which broadcasts to the UI. Pick **one** hardware path. Map real UIDs into `UID_MAP` once known.

| | |
|---|---|
| **Owner** | Same optional track as Phase 5 — **not** the integrator |
| **Depends on** | Phase 5 complete (`bridge/server.js` running, `curl POST /tap` moves money in UI) |
| **Estimated time** | 45–60 min (ACR122U) · 60–90 min (ESP32 + wiring + hotspot) |
| **Required** | **No — OPTIONAL.** Stretch goal per PRD. Only if Phase 5 works **and** ≥30 min remain **and** hardware was tested beforehand. |

> **Conditional gate:** If bridge is flaky, reader untested, or time is tight → **skip.** Judges see identical demo via simulate buttons. Physical tap is memorable but not committed scope.

---

## Files to create / modify

**Option A — ACR122U (USB, PC/SC):**

```
bridge/
  acr122u.js             # nfc-pcsc listener → POST to bridge /tap
lib/
  accounts.ts            # add real UID(s) to UID_MAP
package.json             # nfc-pcsc dep
```

**Option B — ESP32 + PN532 (bundled kit):**

```
(firmware on device — Arduino sketch, not in repo unless team adds it)
lib/
  accounts.ts            # add real UID(s) to UID_MAP
```

**Shared:** No changes to `handleTap`, ledger, or UI components beyond `UID_MAP`.

---

## Hardware choice (pick ONE)

| | Option A — ACR122U | Option B — ESP32 + PN532 |
|---|---|---|
| **Pros** | USB plug-and-play on laptop; no WiFi | Matches bundled kit; stage prop |
| **Cons** | Needs `nfc-pcsc`, Linux/macOS PC/SC | Hotspot setup, IP config, wiring |
| **Deps** | `npm i nfc-pcsc` | Phone hotspot; laptop IP static on hotspot |
| **Tap path** | Reader → `acr122u.js` → `POST /tap` → WS → UI | Reader → ESP32 → `POST /tap` → WS → UI |

**Venue WiFi warning:** ESP32 will fail on captive portal / isolated guest WiFi. Run your **own phone hotspot** so ESP32 and laptop share a private network.

---

## Step-by-step tasks

### Before coding (both options)

- [ ] Phase 5 acceptance passed (`curl` tap moves money)
- [ ] MIFARE demo card(s) in hand
- [ ] Tap each card once; record hex UID from bridge logs or reader utility
- [ ] Add real UIDs to `UID_MAP` in `lib/accounts.ts`:

```ts
export const UID_MAP: Record<string, string> = {
  CUSTOMER_CARD: "customer",
  MARIA_CARD: "maria",
  "04A2B1C3": "maria",   // example — replace with actual UID
};
```

- [ ] Confirm **Maria's card triple duty:** receives tip → tapped to reveal balance → spends $40 (same UID all three)

### Option A — ACR122U

- [ ] Install: `npm i nfc-pcsc`
- [ ] Create `bridge/acr122u.js`:
  - [ ] Use `nfc-pcsc` to listen for `card` events
  - [ ] Read UID; `POST http://localhost:7071/tap` with `{ uid, source: "reader" }`
  - [ ] Disable ACR122U buzzer / auto-poll via APDU to prevent phantom duplicate taps
  - [ ] Debounce: one physical tap = one event (ignore same UID within ~500ms)
- [ ] Run stack:

```bash
node bridge/server.js &
node bridge/acr122u.js
npm run dev
```

- [ ] Tap customer card → Charge Bill $250 + $50 tip → balances 750/200/50
- [ ] Tap Maria card → Spend $40 → balances 10/40; fee line visible

### Option B — ESP32 + PN532

- [ ] Wire PN532 to ESP32 per kit pinout (SPI or I²C — pick one, document pins)
- [ ] Flash firmware that on each read:
  - [ ] Reads MIFARE UID as hex string
  - [ ] `HTTP POST http://<laptop-ip>:7071/tap` body `{"uid":"<hex>","source":"esp32"}`
- [ ] Connect laptop + ESP32 to **phone hotspot**; note laptop IP (`ifconfig` / `ipconfig`)
- [ ] Hardcode or configure ESP32 target IP
- [ ] Same acceptance taps as Option A

---

## Acceptance tests

| # | Test | Expected |
|---|---|---|
| 1 | Physical tap customer card (Charge mode, $250 + $50 tip) | 750 / 200 / 50; split animation fires |
| 2 | Physical tap Maria card (Spend mode, $40) | Maria 10, Taco Stand 40; fee line $0.01 vs Square struck through |
| 3 | Simulate button with reader connected | Still works; no duplicate events |
| 4 | Reader unplugged mid-demo | Click simulate → identical behavior |
| 5 | One tap ≠ multiple ledger ops | Debounce holds; no phantom double-charge |

**Pass criteria:** Real tap is indistinguishable from simulate in the UI. Failure of reader does not block demo.

---

## Paste-ready agent prompts

**Option A (ACR122U):**

```
Add bridge/acr122u.js using nfc-pcsc: on 'card' events, read the UID and forward it to the bridge's POST /tap ingress with source:'reader'. Send the APDU to disable the ACR122U buzzer/auto-poll to prevent duplicate detections. Debounce so one physical tap = one event (ignore same UID within 500ms). Do not change handleTap or ledger code. Real UIDs get mapped in lib/accounts.ts UID_MAP.
```

**Option B (ESP32 — firmware, separate session):**

```
Write Arduino firmware for ESP32 + PN532: on each MIFARE card detect, read UID as hex and HTTP POST to http://<LAPTOP_IP>:7071/tap with JSON {"uid":"<hex>","source":"esp32"}. Use WiFiClient + HTTPClient. Target contract is in Build/contracts.md. Include serial debug logging of UID and HTTP response code.
```

---

## Fallback if blocked

| Blocker | Fallback |
|---|---|
| Reader not detected (ACR122U) | Check PC/SC daemon; try different USB port; **skip → simulate** |
| Phantom / double taps | Disable buzzer APDU; increase debounce; **or skip reader** |
| ESP32 won't connect | Phone hotspot; verify IP; ping laptop from serial monitor; **or skip** |
| UID not in map | Add to `UID_MAP`; restart not required if hot-reload picks it up |
| Any hardware issue on stage | **Unplug reader.** Simulate buttons. Same demo byte-for-byte. |
| Behind schedule | **Skip Phase 6.** PRD committed path is simulate tap. |

---

## Demo-day checklist

- [ ] Real UIDs in `UID_MAP` (tested night before or in 7:30 window)
- [ ] Bridge + reader process running in dedicated terminal
- [ ] Phone hotspot charged (ESP32 only)
- [ ] Rehearse **once with reader**, **once unplugged** (Phase 7)
- [ ] Narration: "read the card as **identity**" — never "charged the card"

---

## Next phase

→ [`07-polish-rehearsal.md`](07-polish-rehearsal.md) — **required** before submit
