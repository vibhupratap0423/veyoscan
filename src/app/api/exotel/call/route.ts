export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Env */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY ?? "";
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN ?? "";
const EXOTEL_SID = process.env.EXOTEL_SID ?? "";
const EXOTEL_SUBDOMAIN = process.env.EXOTEL_SUBDOMAIN ?? "api.in.exotel.com";
const EXOTEL_EXOPHONE = process.env.EXOTEL_EXOPHONE ?? "";

type VehicleRow = { plate: string; owner_id: string; active?: boolean | null };
type ProfileRow = { id: string; phone: string | null; emergency_phone: string | null };

type Body = {
  plate?: string;
  caller_phone?: string;
  mode?: "owner" | "emergency";
};

type JsonObj = Record<string, unknown>;

function bad(message: string, code = 400, extra?: JsonObj) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status: code });
}

function normalizePlate(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+|-/g, "");
}

function normalizeMsisdn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let n = raw.trim();
  if (!n) return null;
  n = n.replace(/[^\d]/g, "");
  if (n.length === 10) n = "91" + n;
  return n;
}

async function safeJson(req: Request): Promise<Body> {
  try {
    const j = (await req.json()) as unknown;
    if (typeof j === "object" && j !== null) return j as Body;
    return {};
  } catch {
    return {};
  }
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function pickSid(parsed: unknown): string | null {
  if (typeof parsed !== "object" || parsed === null) return null;

  // Exotel often returns: { Call: { Sid: "..." } }
  const obj = parsed as Record<string, unknown>;
  const call = obj["Call"];
  if (typeof call === "object" && call !== null) {
    const sid = (call as Record<string, unknown>)["Sid"];
    if (typeof sid === "string" && sid.trim()) return sid;
  }
  // fallback shapes
  const response = obj["response"];
  if (typeof response === "object" && response !== null) {
    const id = (response as Record<string, unknown>)["id"];
    if (typeof id === "string" && id.trim()) return id;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return bad("Supabase env missing", 500);
    if (!EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_SID || !EXOTEL_EXOPHONE)
      return bad("Exotel env missing", 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await safeJson(req);
    const plateRaw = body.plate ?? "";
    const plate = normalizePlate(plateRaw);
    const mode = body.mode ?? "owner";

    if (!plate) return bad("Missing plate");
    if (mode !== "owner" && mode !== "emergency") return bad("Invalid mode");

    const callerPhone = normalizeMsisdn(body.caller_phone ?? null);
    if (!callerPhone) return bad("Missing caller_phone (scanner mobile)", 400);

    // 1) vehicle
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select<"plate, owner_id, active", VehicleRow>("plate, owner_id, active")
      .eq("plate", plate)
      .eq("active", true)
      .maybeSingle();

    if (vErr) return bad(`DB error (vehicle): ${vErr.message}`, 500);
    if (!vehicle) return bad(`No active vehicle found for plate ${plateRaw}`, 404);

    // 2) owner profile
    const { data: owner, error: oErr } = await supabase
      .from("profiles")
      .select<"id, phone, emergency_phone", ProfileRow>("id, phone, emergency_phone")
      .eq("id", vehicle.owner_id)
      .maybeSingle();

    if (oErr) return bad(`DB error (owner): ${oErr.message}`, 500);
    if (!owner) return bad("Owner profile not found", 404);

    const ownerPhone = normalizeMsisdn(owner.phone);
    const emergencyPhone = normalizeMsisdn(owner.emergency_phone);
    const target = mode === "owner" ? ownerPhone : emergencyPhone;

    if (!target) {
      return bad(mode === "owner" ? "Owner phone not set" : "Emergency phone not set", 400);
    }

    // 3) Exotel connect (bridge) with Basic Auth header
    const url = `https://${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}/Calls/connect.json`;
    const authHeader =
      "Basic " + Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString("base64");

    const form = new URLSearchParams();
    form.set("From", callerPhone);
    form.set("To", target);
    form.set("CallerId", EXOTEL_EXOPHONE);
    form.set("CallType", "trans");

    const exotelRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: form.toString(),
    });

    const text = await exotelRes.text();
    const parsed = parseJsonText(text);

    if (!exotelRes.ok) {
      return bad("Exotel call failed", exotelRes.status, { exotel: parsed as unknown });
    }

    const sid = pickSid(parsed);

    return NextResponse.json(
      {
        ok: true,
        plate: vehicle.plate,
        mode,
        caller_phone: callerPhone,
        target_phone: target,
        exotel_call_sid: sid,
        exotel: parsed,
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return bad(`Unhandled: ${message}`, 500);
  }
}
