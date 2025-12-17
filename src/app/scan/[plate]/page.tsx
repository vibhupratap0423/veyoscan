"use client";

import { use, useMemo, useState } from "react";

type Mode = "owner" | "emergency";

function normalizePlate(raw: string) {
  return decodeURIComponent(raw ?? "")
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
  params: Promise<{ plate: string }>;
}) {
  // ✅ unwrap Promise params (new Next behavior)
  const { plate: plateParam } = use(params);

  const plate = useMemo(() => normalizePlate(plateParam || ""), [plateParam]);

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

      if (!plate) {
        setErr("Missing plate");
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
        body: JSON.stringify({ plate, caller_phone: phone, mode }),
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
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Call failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Vehicle Contact</h1>
                <p className="text-indigo-100 text-sm mt-0.5">
                  Connect with vehicle owner
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Plate Number Display */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 border border-white/10">
              <div className="text-sm font-medium text-slate-400 mb-2">
                License Plate
              </div>
              <div className="text-3xl font-bold text-white tracking-wider font-mono">
                {plate || "—"}
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-3">
              <label className="block">
                <div className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Your Mobile Number
                </div>
                <input
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-3.5 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(onlyDigits(e.target.value))}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                />
              </label>
              <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/30 rounded-lg p-3">
                <svg
                  className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Qratech will call this number first, then connect you (masked) to
                  the owner or emergency contact.
                </span>
              </div>
            </div>

            {/* Error Message */}
            {err && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{err}</span>
              </div>
            )}

            {/* Success Message */}
            {msg && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div>{msg}</div>
                    {sid && (
                      <div className="mt-2 text-xs text-emerald-400/80 font-mono">
                        Call SID: {sid}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                onClick={() => start("owner")}
                disabled={!plate || loading !== null}
              >
                {loading === "owner" ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Calling…
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Contact Owner
                  </>
                )}
              </button>

              <button
                className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 text-white font-semibold shadow-lg shadow-red-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                onClick={() => start("emergency")}
                disabled={!plate || loading !== null}
              >
                {loading === "emergency" ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Calling…
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Emergency Call
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
