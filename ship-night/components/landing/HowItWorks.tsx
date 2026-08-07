import Link from "next/link";

const FEATURES = [
  {
    step: "01",
    title: "Customer taps to pay",
    body: "A $250 bill — $200 food, $50 tip — one tap. The card is identity, not a card charge.",
    visual: (
      <div className="flex items-end justify-between">
        <p className="font-mono text-4xl font-bold text-white">$250</p>
        <p className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
          one tap
        </p>
      </div>
    ),
  },
  {
    step: "02",
    title: "Tip splits instantly",
    body: "$200 to the restaurant, $50 lands on Maria's card in seconds. No bank, no payroll wait.",
    visual: (
      <div className="flex items-end gap-4">
        <p className="font-mono text-3xl font-bold text-zinc-300">$200</p>
        <p className="font-mono text-4xl font-bold text-[#ff5a33]">+$50</p>
      </div>
    ),
  },
  {
    step: "03",
    title: "Worker spends in-network",
    body: "Maria taps at the taco stand — $40 moves for a penny. One real Solana devnet tx proves it on-chain.",
    visual: (
      <div className="flex items-end gap-4">
        <p className="font-mono text-4xl font-bold text-white">$0.01</p>
        <p className="font-mono text-2xl font-bold text-red-400 line-through decoration-2">
          $1.14
        </p>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#121111] py-24 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <h2 className="max-w-xl text-3xl font-medium leading-tight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            A closed loop, packed with everything to move money without a bank
          </h2>
          <div>
            <p className="text-zinc-400">
              Dollars enter once and circulate — customer → merchant → worker →
              next merchant — as a stablecoin. Each internal hop costs ~$0.01
              instead of ~3%.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-[14px] bg-white/10 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              Try the demo
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.step}
              className="flex flex-col justify-between rounded-3xl bg-[#171616] p-8 ring-1 ring-white/5"
            >
              <div className="mb-10">{f.visual}</div>
              <div>
                <p className="font-mono text-xs text-zinc-500">{f.step}</p>
                <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {f.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <blockquote className="mx-auto mt-20 max-w-3xl text-center">
          <p className="text-2xl font-medium leading-snug tracking-[-0.01em] text-zinc-200 sm:text-3xl">
            “The tip reaching the worker instantly is a payment Square
            structurally cannot make.”
          </p>
          <footer className="mt-4 text-sm text-zinc-500">
            — the Loop thesis
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
