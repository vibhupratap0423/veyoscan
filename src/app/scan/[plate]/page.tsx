"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

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

export default function ScanCallPage() {
  const params = useParams<{ plate: string }>();
  const plate = useMemo(() => normalizePlate(String(params.plate ?? "")), [params.plate]);

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
            :
            "Calling emergency… Please pick the incoming call to connect."
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
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Vehicle — {plate || "—"}</h1>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
        <div className="text-sm opacity-80">Your Mobile</div>
        <input
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none"
          value={callerPhone}
          onChange={(e) => setCallerPhone(onlyDigits(e.target.value))}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          maxLength={10}
        />
        <div className="text-xs opacity-60">
          Exotel will call this number first, then connect you (masked) to owner or emergency.
        </div>
      </div>

      {err && <div className="rounded bg-red-600/20 text-red-200 px-3 py-2 text-sm">{err}</div>}

      {msg && (
        <div className="rounded bg-emerald-600/20 text-emerald-200 px-3 py-2 text-sm">
          {msg}
          {sid ? <div className="mt-1 text-xs opacity-80">Call SID: {sid}</div> : null}
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-2 text-white"
          onClick={() => start("owner")}
          disabled={!plate || loading !== null}
        >
          {loading === "owner" ? "Calling…" : "Contact Owner"}
        </button>

        <button
          className="flex-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60 px-4 py-2 text-white"
          onClick={() => start("emergency")}
          disabled={!plate || loading !== null}
        >
          {loading === "emergency" ? "Calling…" : "Emergency Call"}
        </button>
      </div>
    </div>
  );
}
