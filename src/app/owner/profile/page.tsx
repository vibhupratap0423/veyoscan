"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type ProfileRow = {
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
  const [uid, setUid] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ keep logic (but DO NOT show it in UI)
  const scanLink = useMemo(() => {
    if (!uid) return "";
    return `/scan/${uid}`;
  }, [uid]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      const { data: auth, error: aErr } = await supabase.auth.getUser();
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
        .maybeSingle<ProfileRow>();

      if (pErr) {
        setErr(pErr.message);
        setLoading(false);
        return;
      }

      if (p) {
        setName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setEmergencyPhone(p.emergency_phone ?? "");
      }

      setLoading(false);
    }

    void load();
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

      const payload: ProfileRow = {
        full_name: name.trim() || null,
        phone: phone ? onlyDigits(phone) : null,
        emergency_phone: emergencyPhone ? onlyDigits(emergencyPhone) : null,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw new Error(error.message);

      setMsg("Profile updated successfully ✅");
    } catch (e: unknown) {
      setErr(getErrMessage(e));
    } finally {
      setBusy(false);
    }
  }

  // ✅ Optional helper: copy scan link (not visible), used internally only if needed later
  async function copyScanLink() {
    if (!scanLink) return;
    try {
      await navigator.clipboard.writeText(scanLink);
      setMsg("Link copied ✅");
    } catch {
      setErr("Copy failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-11 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-11 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-11 rounded-xl bg-white/10 animate-pulse" />
            <div className="h-11 rounded-xl bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 rounded-xl bg-rose-500/15 grid place-items-center">
              <span className="animate-pulse">!</span>
            </div>
            <div>
              <div className="font-semibold">Access denied</div>
              <div className="text-sm opacity-90">{err || "Not logged in"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs tracking-wider text-slate-400 uppercase">
                Account Settings
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                Profile
              </h1>
              <div className="text-sm text-slate-400 break-all">
                {email || "—"}
              </div>
            </div>

            {/* Avatar + subtle animation */}
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-red-to-br from-blue-500/30 to-cyan-400/20 border border-white/10 grid place-items-center shadow-lg">
                <span className="text-white/90 text-lg">👤</span>
              </div>
              <div className="absolute -inset-1 rounded-3xl blur-xl bg-indigo-500/10 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {err ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-500/15 grid place-items-center">
                <span className="animate-bounce">⚠️</span>
              </div>
              <div className="flex-1">{err}</div>
            </div>
          </div>
        ) : null}

        {msg ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 grid place-items-center">
                <span className="animate-bounce">✅</span>
              </div>
              <div className="flex-1">{msg}</div>
            </div>
          </div>
        ) : null}

        {/* Form Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Personal Details</h2>
              <p className="text-sm text-slate-400">
                Keep your contact info updated for alerts & emergency calls.
              </p>
            </div>

            {/* 🔒 Link hidden - only optional internal action */}
            {/* If you want to remove even copy functionality, delete this button */}
            <button
              type="button"
              onClick={() => void copyScanLink()}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition"
              title="Copy QR scan link (internal)"
            >
              <span className="animate-pulse">🔒</span>
              Copy Link
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            {/* Full Name */}
            <div className="group">
              <label className="text-sm text-slate-300">Full Name</label>
              <div className="mt-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition group-focus-within:border-indigo-500/60 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20">
                <span className="text-slate-300 animate-pulse">🪪</span>
                <input
                  className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="group">
              <label className="text-sm text-slate-300">Owner Mobile Number</label>
              <div className="mt-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition group-focus-within:border-indigo-500/60 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20">
                <span className="text-slate-300 animate-pulse">📞</span>
                <input
                  className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(onlyDigits(e.target.value))}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Only digits. Used for ownership & support contact.
              </div>
            </div>

            {/* Emergency Phone */}
            <div className="group">
              <label className="text-sm text-slate-300">Emergency Contact Number</label>
              <div className="mt-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition group-focus-within:border-indigo-500/60 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20">
                <span className="text-slate-300 animate-pulse">🚨</span>
                <input
                  className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(onlyDigits(e.target.value))}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                This number will be used in emergency flow.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 font-semibold transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25"
                onClick={() => void save()}
                disabled={busy}
              >
                <span className={busy ? "animate-spin" : "animate-bounce"}>
                  {busy ? "⏳" : "💾"}
                </span>
                {busy ? "Saving…" : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  // no functionality changed; just clears UI messages
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 hover:bg-white/10 transition active:scale-[0.98]"
              >
                <span className="animate-pulse">🧹</span>
                Clear Message
              </button>
            </div>

            {/* Privacy note */}
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/10 grid place-items-center">
                  <span className="animate-pulse">🛡️</span>
                </div>
                <div>
                  <div className="font-semibold text-white">Privacy</div>
                  <div className="text-slate-400">
                    Do not share your QR scan link to prevent misuse. Only your
                    saved contact details are displayed.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Secured profile settings • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
