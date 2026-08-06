import { NextResponse } from "next/server";
import { DEMO_BILL_TOTAL, DEMO_SPEND, DEMO_TIP, UID_MAP } from "@/lib/accounts";
import { cashOut, getState, payBill, spend } from "@/lib/ledger";
import type { TerminalMode } from "@/lib/tapSource";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    uid: string;
    mode: TerminalMode;
    total?: number;
    tip?: number;
    amount?: number;
  };
  const { uid, mode, total, tip, amount } = body;

  const accountId = UID_MAP[uid];
  if (!accountId) {
    return NextResponse.json({ ok: false, reason: "unknown_uid", accounts: getState() });
  }

  try {
    let result: unknown;
    switch (mode) {
      case "charge":
        result = payBill(accountId, "restaurant", total ?? DEMO_BILL_TOTAL, tip ?? DEMO_TIP, "maria");
        break;
      case "spend":
        result = spend(accountId, "tacostand", amount ?? DEMO_SPEND);
        break;
      case "cashout":
        result = cashOut(accountId);
        break;
      default:
        return NextResponse.json(
          { ok: false, reason: "unknown_mode", accounts: getState() },
          { status: 400 }
        );
    }
    return NextResponse.json({ ok: true, result, accounts: getState() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: (err as Error).message, accounts: getState() },
      { status: 400 }
    );
  }
}
