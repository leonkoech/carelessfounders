import { OUR_FEE } from "./accounts";

export function squareFee(amount: number): number {
  return amount * 0.026 + 0.1;
}

export function ourFee(_amount?: number): number {
  return OUR_FEE;
}
