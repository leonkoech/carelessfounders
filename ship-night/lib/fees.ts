import { OUR_FEE } from "./accounts";

/** Square tap fee: 2.6% + $0.10 */
export function squareFee(amount: number): number {
  return amount * 0.026 + 0.1;
}

/** Loop flat fee — display only, not deducted from balances */
export function ourFee(_amount?: number): number {
  return OUR_FEE;
}
