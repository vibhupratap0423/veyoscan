"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Mode = "owner" | "emergency";

type InvRow = {
  code: string;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
};

function isUuidLike(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
}

function normalizeId(raw: string) {
  const v = decodeURIComponent(raw ?? "").trim();
  if (!v) return "";
  if (isUuidLike(v)) return v;
  return v.toUpperCase().replace(/\s+/g, "");
}

function onlyDigits(v: string) {
  return (v ?? "").replace(/[^\d]/g, "");
}

type ApiOk = { ok: true; exotel_call_sid: string | null };
type ApiErr = { ok: false; error: string; exotel?: unknown };

function isOk(x: unknown): x is ApiOk {
  return typeof x === "object" && x !== null && (x as { ok?: unknown }).ok === true;
}
function isErr(x: unknown): x is ApiErr {
  return typeof x === "object" && x !== null && (x as { ok?: unknown }).ok === false;
}

type AssignQrResponse = { ok: true } | { ok: false; error?: string };

function isAssignQrResponse(x: unknown): x is AssignQrResponse {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.ok === true) return true;
  if (o.ok === false) return true;
  return false;
}

function PhoneIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.6 10.8c1.4 2.7 3.9 5.2 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.2.8.7 0 1.2.5 1.2 1.2V21c0 .7-.5 1.2-1.2 1.2C10.4 22.2 1.8 13.6 1.8 3.2 1.8 2.5 2.3 2 3 2h3.4c.7 0 1.2.5 1.2 1.2 0 1.4.3 2.9.8 4.2.1.4 0 .9-.2 1.2L6.6 10.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 9v4m0 4h.01M10.3 3.9 2.6 18.1c-.6 1.1.2 2.4 1.5 2.4h15.8c1.3 0 2.1-1.3 1.5-2.4L13.7 3.9c-.7-1.2-2.4-1.2-3.4 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ✅ NEW: typed response for /api/scan/profile (no any)
type BloodApiOk = { ok: true; blood_group: string | null };
type BloodApiErr = { ok: false; error: string };
type BloodApiResp = BloodApiOk | BloodApiErr;

function isBloodApiResp(x: unknown): x is BloodApiResp {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.ok === true || o.ok === false;
}

export default function ScanCallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: idParam } = use(params);

  const scanned = useMemo(() => normalizeId(idParam || ""), [idParam]);

  const [inv, setInv] = useState<InvRow | null>(null);
  const [invLoading, setInvLoading] = useState<boolean>(true);
  const [invErr, setInvErr] = useState<string | null>(null);

  const [authId, setAuthId] = useState<string | null>(null);

  const [callerPhone, setCallerPhone] = useState("");
  const [loading, setLoading] = useState<Mode | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sid, setSid] = useState<string | null>(null);

  // ✅ only blood group
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);
  const [bloodLoading, setBloodLoading] = useState(false);

  const effectiveUid = scanned;

  useEffect(() => {
    let alive = true;

    async function init() {
      setInvLoading(true);
      setInvErr(null);

      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;
      if (alive) setAuthId(uid);

      if (!scanned) {
        if (alive) {
          setInv(null);
          setInvLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("qr_inventory")
        .select("code,status,assigned_to,assigned_at")
        .eq("code", scanned)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        setInvErr(error.message);
        setInv(null);
      } else {
        setInv((data as InvRow) ?? null);
      }

      setInvLoading(false);
    }

    void init();
    return () => {
      alive = false;
    };
  }, [scanned]);

  // ✅ fetch blood group via API (NO any)
  useEffect(() => {
    let alive = true;

    async function loadBlood() {
      if (!scanned) {
        if (alive) setBloodGroup(null);
        return;
      }

      setBloodLoading(true);
      try {
        const resp = await fetch("/api/scan/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: inv?.code ? scanned : "",
            uid: !inv?.code && isUuidLike(scanned) ? scanned : "",
          }),
        });

        const parsedUnknown: unknown = await resp.json().catch(() => null);
        if (!alive) return;

        if (!resp.ok || !isBloodApiResp(parsedUnknown) || parsedUnknown.ok !== true) {
          setBloodGroup(null);
          return;
        }

        setBloodGroup(parsedUnknown.blood_group);
      } catch {
        if (alive) setBloodGroup(null);
      } finally {
        if (alive) setBloodLoading(false);
      }
    }

    if (!invLoading) void loadBlood();

    return () => {
      alive = false;
    };
  }, [scanned, invLoading, inv?.code]);

  async function activateQr() {
    try {
      setErr(null);
      setMsg(null);

      if (!inv?.code) {
        setErr("This QR is not in inventory.");
        return;
      }
      if (inv.status !== "available" || inv.assigned_to) {
        setErr("This QR is already activated.");
        return;
      }
      if (!authId) {
        setErr("Please login to activate this QR.");
        return;
      }

      setInvLoading(true);

      const { data, error } = await supabase.rpc("assign_qr_code", {
        p_code: inv.code,
      });
      if (error) throw new Error(error.message);

      const res: AssignQrResponse | null = isAssignQrResponse(data)
        ? (data as AssignQrResponse)
        : null;

      if (!res || res.ok !== true) {
        const msgErr =
          res && "error" in res && typeof res.error === "string"
            ? res.error
            : "Activation failed";
        throw new Error(msgErr);
      }

      const { data: fresh, error: fErr } = await supabase
        .from("qr_inventory")
        .select("code,status,assigned_to,assigned_at")
        .eq("code", inv.code)
        .maybeSingle();

      if (fErr) throw new Error(fErr.message);

      setInv((fresh as InvRow) ?? null);
      setMsg("Activated successfully ✅ Now this QR is linked to your account.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Activation failed");
    } finally {
      setInvLoading(false);
    }
  }

  async function start(mode: Mode) {
    try {
      setErr(null);
      setMsg(null);
      setSid(null);

      if (!effectiveUid) {
        setErr("Missing UID");
        return;
      }

      if (inv?.code && !inv.assigned_to && inv.status === "available") {
        setErr("Please activate this QR first to enable calls.");
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
        body: JSON.stringify({
          uid: effectiveUid,
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
            ? "Connecting you to the vehicle owner… Please answer the incoming call."
            : "Connecting you to the emergency contact… Please answer the incoming call."
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

  const showActivate = !!inv?.code && inv.status === "available" && !inv.assigned_to;
  const isActivated = !!inv?.code && (inv.status === "assigned" || !!inv.assigned_to);

  return (
    <div className="min-h-[calc(100svh-72px)] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-start sm:items-center justify-center px-3 py-3 sm:p-4">
      <div className="w-full max-w-[320px] sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">QRatech Scan</h1>
                <p className="text-indigo-100 text-xs sm:text-sm mt-0.5">
                  {inv?.code ? "Activate & connect" : "Connect with owner"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
            {/* scanned */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">
                Scanned
              </div>

              <div className="text-lg sm:text-xl font-bold text-white font-mono break-all leading-snug">
                {scanned || "—"}
              </div>

              <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-slate-300">
                {invLoading ? (
                  <span>Checking activation…</span>
                ) : inv?.code ? (
                  <span>
                    Status:{" "}
                    <span className="font-semibold">
                      {isActivated ? "Activated" : "Not activated"}
                    </span>
                  </span>
                ) : (
                  <span>Not an inventory QR (using direct UID).</span>
                )}

                {invErr ? (
                  <span className="block mt-1 text-amber-300">
                    Inventory check: {invErr}
                  </span>
                ) : null}
              </div>

              {/* Only Blood Group */}
              <div className="mt-3 pt-3 border-t border-white/10">
                {bloodLoading ? (
                  <div className="text-[11px] sm:text-xs text-slate-300">
                    Loading blood group…
                  </div>
                ) : bloodGroup ? (
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] sm:text-xs text-slate-300">
                      Blood Group
                    </div>
                    <div className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-white text-sm font-semibold">
                      {bloodGroup}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] sm:text-xs text-slate-400">
                    Blood group will appear after activation / if saved by owner.
                  </div>
                )}
              </div>
            </div>

            {/* activate */}
            {showActivate ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                <div className="text-sm text-white font-semibold">Activate this QR</div>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-300">
                  Login required. Activation links this sticker to your account.
                </p>

                <button
                  onClick={() => {
                    if (!authId)
                      router.push(`/auth/sign-in?next=/scan/${encodeURIComponent(scanned)}`);
                    else void activateQr();
                  }}
                  disabled={invLoading}
                  className="mt-3 w-full rounded-xl bg-white text-black px-4 py-2.5 sm:py-3 font-semibold disabled:opacity-60"
                >
                  {authId
                    ? invLoading
                      ? "Activating…"
                      : "Activate / Assign to my account"
                    : "Login to activate"}
                </button>
              </div>
            ) : null}

            {/* call input */}
            <div className="space-y-2.5 sm:space-y-3">
              <label className="block">
                <div className="text-sm font-semibold text-white mb-2">
                  Your Mobile Number
                </div>

                <input
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-3 sm:py-3.5 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base sm:text-lg font-medium"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(onlyDigits(e.target.value))}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                />
              </label>

              <div className="text-[11px] sm:text-xs text-slate-400 bg-slate-800/30 rounded-lg p-2.5 sm:p-3">
                QRatech will call your number first, then connect you securely
                (masked) to the owner or emergency contact.
              </div>
            </div>

            {err && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-2.5 sm:py-3 text-sm">
                {err}
              </div>
            )}

            {msg && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 sm:py-3 text-sm">
                <div>{msg}</div>
                {sid && (
                  <div className="mt-2 text-xs text-emerald-400/80 font-mono">
                    Call SID: {sid}
                  </div>
                )}
              </div>
            )}

            {/* buttons */}
            <div className="space-y-3 sm:space-y-4 pt-0">
              <div>
                <button
                  onClick={() => void start("owner")}
                  disabled={!effectiveUid || loading !== null}
                  className="w-full rounded-2xl px-6 py-3.5 sm:py-4 font-semibold text-slate-900
                             bg-gradient-to-r from-emerald-200 via-blue-300 to-emerald-200
                             hover:from-blue-100 hover:via-yellow-200 hover:to-blue-100
                             disabled:opacity-60 shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="text-slate-900">
                    <PhoneIcon />
                  </span>
                  {loading === "owner" ? "Calling…" : "Call QR Owner"}
                </button>
              </div>

              <div>
                <button
                  onClick={() => void start("emergency")}
                  disabled={!effectiveUid || loading !== null}
                  className="w-full rounded-2xl px-6 py-3.5 sm:py-4 font-semibold text-white
                             bg-red-900/40 border border-red-500/60
                             hover:bg-red-900/55 disabled:opacity-60 shadow-lg
                             flex items-center justify-center gap-2"
                >
                  <span className="text-red-300">
                    <AlertIcon />
                  </span>
                  {loading === "emergency" ? "Calling…" : "SOS"}
                </button>
              </div>
            </div>

            {inv?.code ? (
              <div className="text-[10px] sm:text-[11px] text-slate-400">
                QR Code: <span className="font-mono text-slate-300">{scanned || "—"}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
