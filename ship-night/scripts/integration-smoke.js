#!/usr/bin/env node
/**
 * Integration smoke: bridge HTTP → WS tap event, plus UID_MAP / ledger math.
 * Run: node scripts/integration-smoke.js
 */
const http = require("http");
const path = require("path");
const { WebSocket } = require("ws");

const BRIDGE = process.env.BRIDGE_URL || "http://127.0.0.1:7071";
const WS_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || "ws://127.0.0.1:7071";
const APP = process.env.APP_URL || "http://127.0.0.1:3000";

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

function post(url, payload) {
  const data = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function waitForTap(uid, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const t = setTimeout(() => {
      ws.close();
      reject(new Error(`timeout waiting for tap uid=${uid}`));
    }, timeoutMs);

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (msg.type === "tap" && msg.uid === uid) {
        clearTimeout(t);
        ws.close();
        resolve(msg);
      }
    });
    ws.on("error", (err) => {
      clearTimeout(t);
      reject(err);
    });
    ws.on("open", async () => {
      // unique suffix avoids debounce collision across runs
      await post(`${BRIDGE}/tap`, { uid, source: "reader" });
    });
  });
}

async function main() {
  const results = [];
  const check = (name, ok, detail = "") => {
    results.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  };

  // 1. Bridge health
  try {
    const h = await get(`${BRIDGE}/health`);
    const j = JSON.parse(h.body);
    check("bridge health", h.status === 200 && j.ok === true, `clients=${j.clients}`);
  } catch (e) {
    check("bridge health", false, String(e.message || e));
  }

  // 2. Next app
  try {
    const a = await get(APP);
    check("next app /", a.status === 200, `status=${a.status}`);
  } catch (e) {
    check("next app /", false, String(e.message || e));
  }

  // 3. UID_MAP contains physical cards
  try {
    const fs = require("fs");
    const src = fs.readFileSync(
      path.join(__dirname, "..", "lib", "accounts.ts"),
      "utf8",
    );
    check(
      "UID_MAP has 13108F9E customer",
      /"13108F9E"\s*:\s*"customer"/.test(src),
    );
    check(
      "UID_MAP has 9579D385 maria",
      /"9579D385"\s*:\s*"maria"/.test(src),
    );
  } catch (e) {
    check("UID_MAP physical cards", false, String(e.message || e));
  }

  // 4. Bridge POST → WS broadcast (sim UIDs teammates use)
  try {
    const uid = `SMOKE_${Date.now()}`;
    const ev = await waitForTap(uid);
    check(
      "POST /tap → WS broadcast",
      ev.type === "tap" && ev.uid === uid && ev.source === "reader",
      JSON.stringify(ev),
    );
  } catch (e) {
    check("POST /tap → WS broadcast", false, String(e.message || e));
  }

  // 5. Physical card UIDs accepted by bridge
  for (const uid of ["13108F9E", "9579D385"]) {
    try {
      const res = await post(`${BRIDGE}/tap`, { uid, source: "reader" });
      const j = JSON.parse(res.body);
      check(
        `bridge accepts physical uid ${uid}`,
        res.status === 200 && (j.ok === true),
        j.debounced ? "debounced" : `event=${j.event?.uid}`,
      );
    } catch (e) {
      check(`bridge accepts physical uid ${uid}`, false, String(e.message || e));
    }
  }

  // 6. tapSource exports
  try {
    const fs = require("fs");
    const src = fs.readFileSync(
      path.join(__dirname, "..", "lib", "tapSource.ts"),
      "utf8",
    );
    check(
      "tapSource exports connectTapBridge",
      /export function connectTapBridge/.test(src),
    );
    check(
      "page wires connectTapBridge",
      /connectTapBridge/.test(
        fs.readFileSync(path.join(__dirname, "..", "app", "page.tsx"), "utf8"),
      ),
    );
  } catch (e) {
    check("tapSource / page wiring", false, String(e.message || e));
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(`Summary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main();
