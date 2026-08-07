export default function FeeComparison() {
  return (
    <section id="fees" className="bg-[#fffaf5] py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-[#121111] sm:text-4xl lg:text-5xl">
              Fees that let you sleep easy
            </h2>
            <p className="mt-5 max-w-md text-lg text-zinc-600">
              Card processors move money into a business account and stop.
              Inside Loop, each hop costs about a penny — not a percentage.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                ["Inside the loop", "~$0.01 flat per transfer"],
                ["Tip to worker", "Instant, no bank in the path"],
                ["Settlement", "Real Solana devnet transaction"],
              ].map(([title, sub]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#ff2f00]" />
                  <div>
                    <p className="font-semibold text-[#121111]">{title}</p>
                    <p className="text-sm text-zinc-500">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-[#121111] p-10 text-white shadow-xl">
            <p className="text-sm uppercase tracking-wide text-zinc-500">
              $40 spend at the taco stand
            </p>
            <div className="mt-8 flex flex-wrap items-end gap-10">
              <div>
                <p className="text-sm text-zinc-400">Loop fee</p>
                <p className="mt-1 font-mono text-5xl font-bold text-[#ff5a33] sm:text-6xl">
                  $0.01
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Square</p>
                <p className="mt-1 font-mono text-4xl font-bold text-zinc-500 line-through decoration-red-500 decoration-4 sm:text-5xl">
                  $1.14
                </p>
              </div>
            </div>
            <p className="mt-8 text-sm text-zinc-500">
              Zero-fee applies inside the loop. Doors in and out pay normal
              card rates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
