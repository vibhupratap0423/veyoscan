"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
// import Link from "next/link";

// ✅ Supabase client (browser)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ prevent open-redirect: allow only internal paths like "/get-qr/order?type=vehicle"
function safeNext(next: string | null, fallback = "/owner/profile") {
  if (!next) return fallback;
  const v = next.trim();

  // must start with "/" (internal)
  if (!v.startsWith("/")) return fallback;

  // block protocol-based or double-slash
  if (v.startsWith("//")) return fallback;

  return v;
}

export default function SignInClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ default redirect to profile (if next not provided)
  const nextUrl = useMemo(() => {
    return safeNext(searchParams.get("next"), "/owner/profile");
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ UX states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    // ✅ REAL LOGIN
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // ✅ redirect after successful login (same as your old)
    router.replace(nextUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 space-y-6">
        {/* Heading */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-sm text-slate-400">Sign in to continue</p>
        </div>

        {/* Error */}
        {errorMsg ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Password</label>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* <Link href="/forgot-password" className="text-sm text-slate-700 underline">
              Forgot password?
            </Link> */}
          </div>

          {/* Button */}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Your App. All rights reserved.
        </div>
      </div>
    </div>
  );
}
