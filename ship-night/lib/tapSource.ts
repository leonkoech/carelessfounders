export type TapEvent = {
  type: "tap";
  uid: string;
  source: "reader" | "esp32" | "sim";
  ts: number;
};

export type TerminalMode = "charge" | "spend" | "cashout";

export function makeSimTapEvent(uid: string): TapEvent {
  return { type: "tap", uid, source: "sim", ts: Date.now() };
}

export type TapCallback = (uid: string) => void;

export function simulateTap(uid: string, onTap: TapCallback): void {
  onTap(uid);
}
