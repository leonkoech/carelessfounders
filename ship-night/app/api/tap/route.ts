import { NextResponse } from "next/server";
import { UID_MAP, type TerminalMode } from "@/lib/accounts";
import {
  cashOut,
  getTerminal,
  payBill,
  seedIfEmpty,
  spend,
} from "@/lib/serverLedger";

// Single tap entry point: simulate buttons, the tap-detection API, and any future
// hardware bridge all POST the same shape here. The armed mode/amounts live in
// the ledger backend (set via the dashboard), not in the tap event itself — a
// reader has no idea whether it's a charge, a spend, or a cash-out.
const EXPECTED_ACCOUNT: Record<TerminalMode, string> = {
  charge: "customer",
  spend: "maria",
  cashout: "maria",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    uid?: string;
    source?: "reader" | "esp32" | "sim";
  };
  const uid = body.uid;

  if (!uid) {
    return NextResponse.json({ ok: false, reason: "missing_uid" }, { status: 400 });
  }

  const accountId = UID_MAP[uid];
  if (!accountId) {
    return NextResponse.json({ ok: false, reason: "unknown_uid" });
  }

  await seedIfEmpty();
  const terminal = await getTerminal();

  if (accountId !== EXPECTED_ACCOUNT[terminal.mode]) {
    return NextResponse.json({ ok: false, reason: "wrong_card", mode: terminal.mode });
  }

  try {
    let result: unknown;
    switch (terminal.mode) {
      case "charge":
        result = await payBill(
          "customer",
          "restaurant",
          terminal.total,
          terminal.tip,
          "maria"
        );
        break;
      case "spend":
        result = await spend("maria", "tacostand", terminal.amount);
        break;
      case "cashout":
        result = await cashOut("maria");
        break;
    }
    return NextResponse.json({ ok: true, mode: terminal.mode, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: (err as Error).message },
      { status: 400 }
    );
  }
}
