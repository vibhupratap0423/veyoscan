"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  emergency_phone: string | null;
};

function onlyDigits(v: string) {
  return (v ?? "").replace(/[^\d]/g, "");
}

function getErrMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Something went wrong";
}

export default function ProfilePage() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ short path only (no full url)
  const scanPath = useMemo(() => {
    if (!uid) return "";
    return `/scan/${uid}`;
  }, [uid]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);
      setMsg(null);

      const { data: auth, error: aErr } = await supabase.auth.getUser();
      if (!alive) return;

      if (aErr) {
        setErr(aErr.message);
        setLoading(false);
        return;
      }

      const user = auth?.user;
      if (!user) {
        setErr("Please login first.");
        setLoading(false);
        return;
      }

      setUid(user.id);
      setEmail(user.email ?? "");

      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("full_name, phone, emergency_phone")
        .eq("id", user.id)
        .maybeSingle<Pick<ProfileRow, "full_name" | "phone" | "emergency_phone">>();

      if (!alive) return;

      if (pErr) {
        setErr(pErr.message);
        setLoading(false);
        return;
      }

      setName(p?.full_name ?? "");
      setPhone(p?.phone ?? "");
      setEmergencyPhone(p?.emergency_phone ?? "");

      setLoading(false);
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const { data: auth, error: aErr } = await supabase.auth.getUser();
      if (aErr) throw new Error(aErr.message);

      const user = auth?.user;
      if (!user) throw new Error("Not logged in");

      const p = phone ? onlyDigits(phone) : "";
      const e = emergencyPhone ? onlyDigits(emergencyPhone) : "";

      if (p && p.length !== 10) throw new Error("Owner mobile must be 10 digits");
      if (e && e.length !== 10) throw new Error("Emergency mobile must be 10 digits");

      const payload: ProfileRow = {
        id: user.id,
        full_name: name.trim() || null,
        phone: p || null,
        emergency_phone: e || null,
      };

      // ✅ Upsert so new row is created if missing
      const { error } = await supabase.from("profiles").upsert(payload, {
        onConflict: "id",
      });

      if (error) throw new Error(error.message);

      setMsg("Saved ✅");
    } catch (e: unknown) {
      setErr(getErrMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyScanPath() {
    if (!scanPath) return;
    try {
      await navigator.clipboard.writeText(scanPath);
      setMsg("Scan path copied ✅");
    } catch {
      setErr("Copy failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-slate-200">Loading…</div>
        </div>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">
          <div className="font-semibold">Access denied</div>
          <div className="text-sm opacity-90">{err || "Not logged in"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs tracking-wider text-slate-400 uppercase">Account</div>
          <h1 className="mt-1 text-2xl font-semibold text-white">Profile</h1>
          <div className="mt-1 text-sm text-slate-400 break-all">{email || "—"}</div>
        </div>

        {/* Alert */}
        {err ? (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}
        {msg ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {msg}
          </div>
        ) : null}

        {/* Scan path (short only) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">QR Scan Path</div>
              <div className="text-xs text-slate-400">Short path only (no full link).</div>
            </div>
            <button
              type="button"
              onClick={() => void copyScanPath()}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Copy
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="text-xs text-slate-400">UID</div>
            <div className="text-sm text-white break-all">{uid}</div>

            <div className="mt-2 text-xs text-slate-400">Path</div>
            <div className="text-sm text-white break-all">{scanPath}</div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Personal Details</h2>
          <p className="text-sm text-slate-400">
            Keep your contact info updated for alerts & emergency calls.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-slate-300">Full Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Owner Mobile Number</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(onlyDigits(e.target.value))}
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
              />
              <div className="mt-1 text-xs text-slate-500">10 digits only.</div>
            </div>

            <div>
              <label className="text-sm text-slate-300">Emergency Contact Number</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(onlyDigits(e.target.value))}
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
              />
              <div className="mt-1 text-xs text-slate-500">10 digits only.</div>
            </div>

            <div className="pt-2">
              <button
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 font-semibold disabled:opacity-60"
                onClick={() => void save()}
                disabled={busy}
              >
                {busy ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Secured profile settings • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
