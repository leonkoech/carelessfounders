# Tap API — how hardware reaches the UI

Hardware (PN532 USB reader) and teammates share **one** ingress: the tap bridge.

## Contract

### Publish a tap (hardware / curl / ESP32)

```http
POST http://localhost:7071/tap
Content-Type: application/json

{ "uid": "13108F9E", "source": "reader" }
```

`source` is `"reader" | "esp32" | "sim"`. Downstream ignores it; only `uid` matters.

### Subscribe (Next.js UI)

```ts
import { connectTapBridge } from "@/lib/tapSource";

// inside a client component, same handler as SimulateBar:
useEffect(() => {
  const bridge = connectTapBridge(handleTap);
  return () => bridge.close();
}, [handleTap]);
```

WebSocket URL: `NEXT_PUBLIC_BRIDGE_URL` (default `ws://localhost:7071`).

Broadcast payload:

```json
{ "type": "tap", "uid": "13108F9E", "source": "reader", "ts": 1690000000000 }
```

### Health

```bash
curl http://localhost:7071/health
```

## Run order (demo)

```bash
# terminal 1 — bridge (required for physical taps)
npm run bridge

# terminal 2 — Next app
npm run dev

# terminal 3 — PN532 USB reader → POSTs into bridge
npm run reader
```

Simulate buttons work with the bridge **stopped**. Physical taps need the bridge.

## Known demo UIDs (from hardware)

| UID (hex) | Suggested role | Map in `UID_MAP` |
|-----------|----------------|------------------|
| `13108F9E` | customer | `"13108F9E": "customer"` |
| `9579D385` | maria | `"9579D385": "maria"` |

Keep `CUSTOMER_CARD` / `MARIA_CARD` for simulate buttons.

## Smoke test (no hardware)

```bash
npm run bridge
curl -X POST http://localhost:7071/tap \
  -H 'Content-Type: application/json' \
  -d '{"uid":"MARIA_CARD","source":"reader"}'
```

UI in Spend mode should behave like “Simulate: Maria taps”.
