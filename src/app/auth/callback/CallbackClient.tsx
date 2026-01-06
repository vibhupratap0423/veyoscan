// src/app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function safeNext(next: string | null, fallback = "/owner/profile") {
  if (!next) return fallback;
  const v = next.trim();
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//")) return fallback;
  return v;
}

function getErrMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Signing in failed. Please try again.";
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextUrl = useMemo(() => safeNext(sp.get("next"), "/owner/profile"), [sp]);

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setErr(null);

        // ✅ If supabase oauth redirects with `?code=...`, exchange it
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            window.location.search
          );
          if (error) throw error;
        }

        // ✅ Ensure session exists
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("No session found. Please login again.");

        router.replace(nextUrl);
      } catch (e: unknown) {
        if (!mounted) return;
        setErr(getErrMessage(e));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, sp, nextUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-lg font-semibold">Signing you in...</div>

        {err ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {err}
          </div>
        ) : null}
      </div>
    </div>
  );
}
