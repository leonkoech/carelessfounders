import { NextResponse } from "next/server";
import { getState } from "@/lib/ledger";

export async function GET() {
  return NextResponse.json({ accounts: getState() });
}
