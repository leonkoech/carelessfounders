/**
 * Tap sources for the demo.
 *
 * - simulateTap: UI buttons (works with bridge offline)
 * - connectTapBridge: subscribe to Phase 5 bridge WebSocket
 *
 * Contract (Build/contracts.md):
 *   WS message → { type: "tap", uid: string, source: string, ts: number }
 *   Downstream only uses uid → call the same handleTap(uid) as SimulateBar.
 */

export type TapCallback = (uid: string) => void;

export type TapEvent = {
  type: "tap";
  uid: string;
  source: "reader" | "esp32" | "sim" | string;
  ts: number;
};

export function simulateTap(uid: string, onTap: TapCallback): void {
  onTap(uid);
}

export type BridgeHandle = {
  close: () => void;
};

/**
 * Open a WebSocket to the tap bridge. On each tap event, call onTap(uid).
 * Safe no-op if URL is empty or `?sim=1` (rehearsal mode).
 */
export function connectTapBridge(
  onTap: TapCallback,
  options?: {
    url?: string;
    /** When true, never connect (simulate-only rehearsal). */
    simulateOnly?: boolean;
  },
): BridgeHandle {
  const simulateOnly =
    options?.simulateOnly === true ||
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("sim") === "1");

  const url =
    options?.url ??
    process.env.NEXT_PUBLIC_BRIDGE_URL ??
    "ws://localhost:7071";

  if (simulateOnly || !url) {
    return { close: () => {} };
  }

  let closed = false;
  let socket: WebSocket | null = null;
  let retryMs = 500;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearRetry = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const connect = () => {
    if (closed) return;
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleRetry();
      return;
    }

    socket.onopen = () => {
      retryMs = 500;
      console.info("[tapSource] bridge connected", url);
    };

    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as Partial<TapEvent> & {
          type?: string;
        };
        if (msg.type === "tap" && typeof msg.uid === "string" && msg.uid) {
          onTap(msg.uid);
        }
      } catch {
        // ignore non-JSON
      }
    };

    socket.onclose = () => {
      socket = null;
      if (!closed) scheduleRetry();
    };

    socket.onerror = () => {
      // onclose will fire and retry
    };
  };

  const scheduleRetry = () => {
    clearRetry();
    timer = setTimeout(() => {
      retryMs = Math.min(retryMs * 2, 5000);
      connect();
    }, retryMs);
  };

  connect();

  return {
    close: () => {
      closed = true;
      clearRetry();
      if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
      }
    },
  };
}
