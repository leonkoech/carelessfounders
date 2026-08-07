import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_BILL_TOTAL, DEMO_SPEND, DEMO_TIP, OUR_FEE } from "./accounts";
import { ourFee, squareFee } from "./fees";
import { cashOut, getState, payBill, reset, spend } from "./ledger";

beforeEach(() => {
  reset();
});

function balanceOf(id: string): number {
  const account = getState().find((a) => a.id === id);
  if (!account) throw new Error(`missing account ${id}`);
  return account.balance;
}

describe("fees", () => {
  it("computes Square fee for demo spend", () => {
    expect(squareFee(DEMO_SPEND)).toBeCloseTo(1.14, 10);
  });

  it("returns flat ourFee", () => {
    expect(ourFee()).toBe(OUR_FEE);
    expect(ourFee(DEMO_SPEND)).toBe(0.01);
  });
});

describe("payBill", () => {
  it("splits food and tip across merchant and worker", () => {
    const result = payBill(
      "customer",
      "restaurant",
      DEMO_BILL_TOTAL,
      DEMO_TIP,
      "maria"
    );

    expect(result).toEqual({
      merchantCredited: 200,
      tipCredited: 50,
      breakdown: { food: 200, tip: 50 },
    });
    expect(balanceOf("customer")).toBe(750);
    expect(balanceOf("restaurant")).toBe(200);
    expect(balanceOf("maria")).toBe(50);
  });

  it("throws on insufficient balance", () => {
    expect(() =>
      payBill("customer", "restaurant", 10_000, 0, "maria")
    ).toThrow("Insufficient balance");
  });

  it("throws on missing account", () => {
    expect(() =>
      payBill("ghost", "restaurant", DEMO_BILL_TOTAL, DEMO_TIP, "maria")
    ).toThrow("Account not found");
  });
});

describe("spend", () => {
  it("transfers amount and reports display-only fees", () => {
    payBill("customer", "restaurant", DEMO_BILL_TOTAL, DEMO_TIP, "maria");

    const result = spend("maria", "tacostand", DEMO_SPEND);

    expect(result.amount).toBe(40);
    expect(result.ourFee).toBe(0.01);
    expect(result.squareFee).toBeCloseTo(1.14, 10);
    expect(balanceOf("maria")).toBe(10);
    expect(balanceOf("tacostand")).toBe(40);
    // ourFee is display-only — not deducted from balances
    expect(balanceOf("maria") + balanceOf("tacostand")).toBe(50);
  });
});

describe("cashOut", () => {
  it("hands maria's full tip (50) to the agent", () => {
    payBill("customer", "restaurant", DEMO_BILL_TOTAL, DEMO_TIP, "maria");

    const result = cashOut("maria");

    expect(result.cashHanded).toBe(50);
    expect(balanceOf("maria")).toBe(0);
    expect(balanceOf("agent")).toBe(5050);
  });

  it("hands remaining balance after spend (10) to the agent", () => {
    payBill("customer", "restaurant", DEMO_BILL_TOTAL, DEMO_TIP, "maria");
    spend("maria", "tacostand", DEMO_SPEND);

    const result = cashOut("maria");

    expect(result.cashHanded).toBe(10);
    expect(balanceOf("maria")).toBe(0);
    expect(balanceOf("agent")).toBe(5010);
  });
});

describe("getState / reset", () => {
  it("returns safe copies, not mutable refs", () => {
    const snapshot = getState();
    snapshot[0].balance = -999;
    expect(balanceOf("customer")).toBe(1000);
  });

  it("restores seed balances", () => {
    payBill("customer", "restaurant", DEMO_BILL_TOTAL, DEMO_TIP, "maria");
    spend("maria", "tacostand", DEMO_SPEND);
    cashOut("maria");

    reset();

    expect(balanceOf("customer")).toBe(1000);
    expect(balanceOf("restaurant")).toBe(0);
    expect(balanceOf("maria")).toBe(0);
    expect(balanceOf("tacostand")).toBe(0);
    expect(balanceOf("agent")).toBe(5000);
  });
});
