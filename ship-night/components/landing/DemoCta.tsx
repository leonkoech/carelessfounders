import Link from "next/link";
import { LoopMark } from "@/components/LoopLogo";

export default function DemoCta() {
  return (
    <section id="demo" className="relative overflow-hidden bg-[#121111] py-32">
      {/* starfield */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        {[
          [12, 18],
          [28, 64],
          [41, 30],
          [55, 78],
          [67, 22],
          [79, 55],
          [88, 35],
          [18, 82],
          [72, 88],
          [92, 70],
        ].map(([x, y]) => (
          <span
            key={`${x}-${y}`}
            className="absolute h-px w-px rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
        <div className="absolute -left-24 top-10 h-px w-52 rotate-[35deg] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute left-1/4 -top-6 h-px w-40 rotate-[35deg] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center text-white sm:px-6">
        <h2 className="text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-5xl">
          Experience payments like never before with Loop
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-zinc-400">
          Bill pay, tip split, worker spend, fee comparison — and a real Solana
          devnet signature on Explorer. Under 3 minutes.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-[#ff2f00] px-6 py-3 text-base font-medium text-white transition hover:bg-[#e62a00]"
        >
          <LoopMark size={18} />
          Enter demo portal
        </Link>
        <p className="mt-4 text-sm text-zinc-500">
          Simulate taps in the browser — no hardware required
        </p>
      </div>
    </section>
  );
}
