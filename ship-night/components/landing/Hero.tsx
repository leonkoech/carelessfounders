import Link from "next/link";
import { LoopMark } from "@/components/LoopLogo";

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[300px] sm:w-[340px]">
      <div className="rounded-[44px] border-[10px] border-[#121111] bg-white shadow-2xl shadow-orange-950/20">
        <div className="rounded-[34px] bg-[#fffaf5] px-5 pb-8 pt-4">
          {/* status bar */}
          <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-[#121111]">
            <span>9:41</span>
            <span className="mx-auto -ml-4 h-5 w-20 rounded-full bg-[#121111]" />
            <span>●●●</span>
          </div>

          <p className="mt-5 text-sm font-medium text-zinc-500">
            The Restaurant
          </p>
          <p className="mt-1 font-mono text-4xl font-bold tracking-tight text-[#121111]">
            $250.00
          </p>

          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#121111] text-xs font-bold text-white">
                  R
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#121111]">Food</p>
                  <p className="text-xs text-zinc-500">Restaurant</p>
                </div>
              </div>
              <p className="font-mono text-sm font-bold text-[#121111]">
                $200.00
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff2f00] text-xs font-bold text-white">
                  M
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#121111]">Tip</p>
                  <p className="text-xs text-zinc-500">→ Maria, instantly</p>
                </div>
              </div>
              <p className="font-mono text-sm font-bold text-[#ff2f00]">
                $50.00
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[#121111] py-3.5 text-sm font-medium text-white">
            <LoopMark size={18} />
            Tap to pay
          </div>

          <p className="mt-3 text-center text-[11px] text-zinc-400">
            Settled on Solana · fee $0.01
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#fffaf5] pb-16 pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-64 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#ff2f00]/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
        <h1 className="mx-auto max-w-4xl text-5xl font-medium leading-[0.97] tracking-[-0.04em] text-[#121111] sm:text-7xl lg:text-[88px]">
          Reimagine How Money Reaches Workers
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600">
          From bill to tip to spend — value circulates in seconds on
          near-zero-fee stablecoin rails, settled on Solana.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-[14px] bg-[#ff2f00] px-6 py-3 text-base font-medium text-white transition hover:bg-[#e62a00]"
          >
            Open demo portal
          </Link>
          <a
            href="#how-it-works"
            className="rounded-[14px] px-6 py-3 text-base font-medium text-[#121111] transition hover:bg-black/5"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          No hardware needed — simulate taps in the browser
        </p>

        <div className="mt-14">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
