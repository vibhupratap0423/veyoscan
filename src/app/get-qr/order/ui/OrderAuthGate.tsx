"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import OrderForm from "./OrderForm";

export default function OrderAuthGate({
  type,
  pack,
}: {
  type: string;
  pack?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const C = useMemo(
    () => ({
      card:
        "rounded-3xl border border-white/10 bg-white/10 p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
      btn: "rounded-xl px-4 py-2 font-semibold transition",
      btnGhost:
        "rounded-xl px-4 py-2 font-semibold border border-white/15 text-white/90 hover:bg-white/10 transition",
      helper: "mt-2 text-xs text-white/60",
    }),
    []
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const next = useMemo(() => {
    return `/get-qr/order?type=${encodeURIComponent(type)}${
      pack ? `&pack=${encodeURIComponent(pack)}` : ""
    }`;
  }, [type, pack]);

  const goLogin = () => router.push(`/auth/sign-in?next=${encodeURIComponent(next)}`);
  const goRegister = () => router.push(`/auth/sign-up?next=${encodeURIComponent(next)}`);

  if (loading) {
    return <div className={`${C.card} text-center text-white/80`}>Loading…</div>;
  }

  if (!user) {
    return (
      <div className={`${C.card} text-center`}>
        <p className="text-white/90 text-lg font-semibold">
          Sign in required to place an order
        </p>
        <p className="mt-2 text-white/70 text-sm">
          Continue to order your <span className="text-white">{type}</span> QR.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="w-full sm:w-auto">
            <button
              onClick={goLogin}
              className={`${C.btn} w-full sm:w-auto bg-white text-black hover:bg-white/90`}
            >
              Login
            </button>
            <div className={C.helper}>If you already have an account, login.</div>
          </div>

          <div className="w-full sm:w-auto">
            <button onClick={goRegister} className={`${C.btnGhost} w-full sm:w-auto`}>
              Register
            </button>
            <div className={C.helper}>If you are a new user, please register.</div>
          </div>
        </div>
      </div>
    );
  }

  return <OrderForm type={type} pack={pack} />;
}
