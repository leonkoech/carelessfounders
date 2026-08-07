import { NextResponse } from "next/server";
import { resetAccounts } from "@/lib/firestoreLedger";

export async function POST() {
  await resetAccounts();
  return NextResponse.json({ ok: true });
}
