import { OUR_FEE } from "./accounts";

// Square tap rate: 2.6% + $0.10
export function squareFee(amount: number): number {
  return amount * 0.026 + 0.1;
}

export function ourFee(_amount?: number): number {
  return OUR_FEE;
}
