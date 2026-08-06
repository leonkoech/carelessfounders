export type TapCallback = (uid: string) => void;

export function simulateTap(uid: string, onTap: TapCallback): void {
  onTap(uid);
}
