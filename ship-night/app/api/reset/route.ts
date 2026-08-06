import { NextResponse } from "next/server";
import { getState, reset } from "@/lib/ledger";

export async function POST() {
  reset();
  return NextResponse.json({ accounts: getState() });
}
