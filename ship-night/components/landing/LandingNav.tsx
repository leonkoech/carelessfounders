import Link from "next/link";
import { LoopMark } from "@/components/LoopLogo";

export default function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full bg-[#121111] py-2 pl-2 pr-2 shadow-lg shadow-black/10">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center"
          aria-label="Loop home"
        >
          <LoopMark size={30} />
        </Link>

        <nav className="flex items-center gap-1 px-2 text-sm text-zinc-300">
          <a
            href="#how-it-works"
            className="rounded-full px-3 py-1.5 transition hover:text-white"
          >
            How it works
          </a>
          <a
            href="#fees"
            className="rounded-full px-3 py-1.5 transition hover:text-white"
          >
            Fees
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#121111] transition hover:bg-zinc-200"
        >
          Portal login
        </Link>
      </div>
    </header>
  );
}
