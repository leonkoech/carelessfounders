"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LoopLogo from "@/components/LoopLogo";
import { signOut } from "@/lib/demo-auth";

export default function PortalHeader() {
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center">
          <LoopLogo
            size={26}
            wordmarkClassName="text-base font-semibold tracking-tight text-white"
          />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
