"use client";

import { use, useMemo, useState } from "react";

type Mode = "owner" | "emergency";

function normalizeUid(raw: string) {
  return decodeURIComponent(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}

function onlyDigits(v: string) {
  return (v ?? "").replace(/[^\d]/g, "");
}

type ApiOk = {
  ok: true;
  exotel_call_sid: string | null;
};

type ApiErr = {
  ok: false;
  error: string;
  exotel?: unknown;
};

function isOk(x: unknown): x is ApiOk {
  return typeof x === "object" && x !== null && (x as { ok?: unknown }).ok === true;
}
function isErr(x: unknown): x is ApiErr {
  return typeof x === "object" && x !== null && (x as { ok?: unknown }).ok === false;
}

export default function ScanCallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const uid = useMemo(() => normalizeUid(idParam || ""), [idParam]);

  const [callerPhone, setCallerPhone] = useState("");
  const [loading, setLoading] = useState<Mode | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sid, setSid] = useState<string | null>(null);

  async function start(mode: Mode) {
    try {
      setErr(null);
      setMsg(null);
      setSid(null);

      if (!uid) {
        setErr("Missing UID");
        return;
      }

      const phone = onlyDigits(callerPhone);
      if (phone.length !== 10) {
        setErr("Enter your 10-digit mobile number.");
        return;
      }

      setLoading(mode);

      const resp = await fetch("/api/exotel/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ send uid (backend accepts uid/id/plate)
        body: JSON.stringify({
          uid,
          caller_phone: phone,
          mode,
        }),
      });

      const text = await resp.text();
      const parsed: unknown = (() => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return { ok: false, error: text } as ApiErr;
        }
      })();

      if (!resp.ok) {
        if (isErr(parsed)) throw new Error(parsed.error);
        throw new Error("Call failed");
      }

      if (isOk(parsed)) {
        setSid(parsed.exotel_call_sid ?? null);
        setMsg(
          mode === "owner"
            ? "Calling owner… Please pick the incoming call to connect."
            : "Calling emergency… Please pick the incoming call to connect."
        );
        return;
      }

      if (isErr(parsed)) throw new Error(parsed.error);
      throw new Error("Unexpected response");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Call failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Vehicle Contact</h1>
                <p className="text-indigo-100 text-sm mt-0.5">Connect with vehicle owner</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 border border-white/10">
              <div className="text-sm font-medium text-slate-400 mb-2">UID</div>
              <div className="text-xl font-bold text-white font-mono break-all">
                {uid || "—"}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <div className="text-sm font-semibold text-white mb-2">Your Mobile Number</div>
                <input
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(onlyDigits(e.target.value))}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                />
              </label>

              <div className="text-xs text-slate-400 bg-slate-800/30 rounded-lg p-3">
                Qratech will call this number first, then connect you (masked) to the owner/emergency contact.
              </div>
            </div>

            {err && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm">
                {err}
              </div>
            )}

            {msg && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 text-sm">
                <div>{msg}</div>
                {sid && <div className="mt-2 text-xs text-emerald-400/80 font-mono">Call SID: {sid}</div>}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 px-6 py-4 text-white font-semibold"
                onClick={() => void start("owner")}
                disabled={!uid || loading !== null}
              >
                {loading === "owner" ? "Calling…" : "Contact Owner"}
              </button>

              <button
                className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 px-6 py-4 text-white font-semibold"
                onClick={() => void start("emergency")}
                disabled={!uid || loading !== null}
              >
                {loading === "emergency" ? "Calling…" : "Emergency Call"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
