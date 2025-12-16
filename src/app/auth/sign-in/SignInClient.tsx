"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
// import { supabase } from "@/lib/supabaseClient"; // if using supabase

export default function SignInClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // example: read redirect
  const nextUrl = useMemo(() => {
    return searchParams.get("next") || "/dashboard";
  }, [searchParams]);

  // ---- your existing sign-in UI / logic below ----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // do your login then:
    router.push(nextUrl);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded bg-white/10 border border-white/10 px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded bg-white/10 border border-white/10 px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full rounded bg-indigo-600 px-4 py-2 text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
