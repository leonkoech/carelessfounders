import { NextResponse } from "next/server";
import {
  getAccounts,
  getTerminal,
  hasFirestore,
  setTerminal,
} from "@/lib/serverLedger";
import type { TerminalState } from "@/lib/firestoreLedger";

export async function GET() {
  const [accounts, terminal] = await Promise.all([getAccounts(), getTerminal()]);
  return NextResponse.json({ accounts, terminal, backend: hasFirestore ? "firestore" : "memory" });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { terminal?: TerminalState }
    | null;

  if (!body?.terminal) {
    return NextResponse.json({ ok: false, reason: "missing_terminal" }, { status: 400 });
  }

  await setTerminal(body.terminal);
  return NextResponse.json({ ok: true });
}
