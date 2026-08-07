import { NextResponse } from "next/server";
import { settle } from "@/lib/solana";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}) as { amount?: number });
  const amount = typeof body.amount === "number" ? body.amount : 1;

  const result = await settle(amount);
  return NextResponse.json(result);
}
