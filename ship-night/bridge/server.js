#!/usr/bin/env node
/**
 * Tap bridge — shared ingress for hardware + curl.
 *
 * HTTP:  POST http://localhost:7071/tap  { "uid": "...", "source": "reader"|"esp32"|"sim" }
 * WS:    ws://localhost:7071             → { "type":"tap", "uid", "source", "ts" }
 *
 * UI teammates: subscribe via connectTapBridge() in lib/tapSource.ts and call handleTap(uid).
 */
const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.BRIDGE_PORT || 7071);
const DEBOUNCE_MS = Number(process.env.BRIDGE_DEBOUNCE_MS || 500);

/** @type {Map<string, number>} */
const lastTapAt = new Map();

const server = http.createServer((req, res) => {
  // CORS: Next.js on :3000 talking to bridge on :7071 (browser fetch rare; curl/reader don't need it)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "ship-night-tap-bridge",
        port: PORT,
        clients: wss.clients.size,
        contract: {
          post: "POST /tap { uid, source?}",
          ws: `ws://localhost:${PORT}`,
          event: { type: "tap", uid: "string", source: "reader|esp32|sim", ts: "number" },
        },
      }),
    );
    return;
  }

  if (req.method === "POST" && req.url === "/tap") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 4096) req.destroy();
    });
    req.on("end", () => {
      let parsed;
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "invalid JSON" }));
        return;
      }

      const uid = typeof parsed.uid === "string" ? parsed.uid.trim() : "";
      if (!uid) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "uid required" }));
        return;
      }

      const source =
        typeof parsed.source === "string" && parsed.source
          ? parsed.source
          : "reader";

      const event = broadcastTap(uid, source);
      if (!event) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, debounced: true, uid }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, event }));
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not found" }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  console.log(`[bridge] client connected (n=${wss.clients.size})`);
  socket.send(
    JSON.stringify({
      type: "hello",
      service: "ship-night-tap-bridge",
      ts: Date.now(),
    }),
  );
  socket.on("close", () => {
    console.log(`[bridge] client disconnected (n=${wss.clients.size})`);
  });
});

function broadcastTap(uid, source) {
  const now = Date.now();
  const prev = lastTapAt.get(uid) || 0;
  if (now - prev < DEBOUNCE_MS) {
    console.log(`[bridge] debounce uid=${uid} source=${source}`);
    return null;
  }
  lastTapAt.set(uid, now);

  const event = { type: "tap", uid, source, ts: now };
  const payload = JSON.stringify(event);
  let n = 0;
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload);
      n += 1;
    }
  }
  console.log(
    `[bridge] tap uid=${uid} source=${source} clients=${n} ts=${now}`,
  );
  return event;
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[bridge] listening http://0.0.0.0:${PORT}  ws://0.0.0.0:${PORT}`);
  console.log(`[bridge] POST /tap  { "uid":"...", "source":"reader" }`);
});
