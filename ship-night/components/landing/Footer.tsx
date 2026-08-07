import Link from "next/link";
import LoopLogo from "@/components/LoopLogo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#121111] py-14 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <LoopLogo size={30} />
          <p className="mt-3 max-w-xs text-sm text-zinc-500">
            Stablecoin-style SPL token on Solana devnet — Ship Night demo.
          </p>
        </div>

        <nav className="flex flex-col gap-2.5 text-sm text-zinc-400">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#fees" className="transition hover:text-white">
            Fees
          </a>
          <Link href="/login" className="transition hover:text-white">
            Portal
          </Link>
        </nav>

        <div className="text-sm">
          <p className="text-zinc-400">Demo credentials</p>
          <p className="mt-2 font-mono text-zinc-300">
            demo@loop.app
            <br />
            loopdemo
          </p>
        </div>
      </div>
    </footer>
  );
}
