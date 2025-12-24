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
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-zinc-500">Loading profile…</div>;
  }

  if (!uid) {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {err || "Not logged in"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="text-sm text-zinc-500">Email: {email}</div>

      {/* ✅ QR Scan Link */}
      <div className="rounded-xl border border-zinc-200 bg-black-50 p-3">
        <div className="text-xs text-zinc-500 mb-1">Your QR Scan Link</div>
        <div className="font-mono text-sm break-all">{scanLink}</div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {msg}
        </div>
      )}

      <div>
        <label className="text-sm text-zinc-500">Full Name</label>
        <input
          className="w-full mt-1 p-2 rounded border"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>

      <div>
        <label className="text-sm text-zinc-500">Owner Mobile Number</label>
        <input
          className="w-full mt-1 p-2 rounded border"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(onlyDigits(e.target.value))}
          placeholder="10-digit mobile"
          inputMode="numeric"
          maxLength={10}
        />
      </div>

      <div>
        <label className="text-sm text-zinc-500">Emergency Contact Number</label>
        <input
          className="w-full mt-1 p-2 rounded border"
          type="tel"
          value={emergencyPhone}
          onChange={(e) => setEmergencyPhone(onlyDigits(e.target.value))}
          placeholder="10-digit mobile"
          inputMode="numeric"
          maxLength={10}
        />
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded disabled:opacity-60"
        onClick={() => void save()}
        disabled={busy}
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
