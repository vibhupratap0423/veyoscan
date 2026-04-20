// src/app/reset-password/ResetPasswordClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function getErrMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Failed to update password";
}

export default function ResetPasswordClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!mounted) return;
        setErr(null);

        const code = sp.get("code");
        // If user opened page directly, allow manual set (but updateUser will fail without session)
        if (!code) {
          if (mounted) setReady(true);
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        );

        if (error && mounted) setErr(error.message);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sp]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (password.length < 6) return setErr("Password must be at least 6 chars");
    if (password !== confirm) return setErr("Passwords do not match");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg("Veyoscan password updated ✅ Redirecting...");
      setTimeout(() => router.replace("/auth/sign-in"), 900);
    } catch (e: unknown) {
      setErr(getErrMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Reset Veyoscan Password
          </h1>
          <p className="text-sm text-slate-400">Set your new Veyoscan account password.</p>
        </div>

        {!ready ? (
          <div className="text-sm text-slate-300">Loading...</div>
        ) : (
          <>
            {err ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                {err}
              </div>
            ) : null}

            {msg ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                {msg}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-300">New Password</label>
                <input
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-300">Confirm Password</label>
                <input
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition"
                  placeholder="••••••••"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}