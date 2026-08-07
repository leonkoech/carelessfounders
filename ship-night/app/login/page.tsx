"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import LoopLogo from "@/components/LoopLogo";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  isAuthenticated,
  signIn,
} from "@/lib/demo-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/portal");
    }
  }, [router]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (signIn(email, password)) {
      router.push("/portal");
      return;
    }
    setError("Invalid credentials. Use the demo login shown below.");
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-[#fffaf5] text-[#121111]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-[#ff2f00]/10 blur-[100px]" />
      </div>

      <header className="relative px-5 py-5">
        <Link href="/" className="inline-flex">
          <LoopLogo size={30} />
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-medium tracking-[-0.03em]">
            Portal login
          </h1>
          <p className="mt-2 text-zinc-600">
            Demo access for the live tap-payment dashboard.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5 rounded-3xl bg-white p-8 shadow-xl shadow-orange-950/5 ring-1 ring-black/5"
          >
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="mt-1.5 w-full rounded-[14px] border border-zinc-200 bg-[#fffaf5] px-4 py-3 text-[#121111] outline-none ring-[#ff2f00]/40 focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-600">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-[14px] border border-zinc-200 bg-[#fffaf5] px-4 py-3 text-[#121111] outline-none ring-[#ff2f00]/40 focus:ring-2"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-[14px] bg-[#ff2f00] py-3 text-sm font-medium text-white transition hover:bg-[#e62a00]"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-4 text-sm text-zinc-600">
            <p className="font-medium text-[#121111]">Demo credentials</p>
            <p className="mt-2 font-mono">
              {DEMO_EMAIL}
              <br />
              {DEMO_PASSWORD}
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/" className="text-[#ff2f00] hover:text-[#e62a00]">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
