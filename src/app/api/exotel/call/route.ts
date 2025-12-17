import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY ?? "";
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN ?? "";
const EXOTEL_SID = process.env.EXOTEL_SID ?? "";
const EXOTEL_SUBDOMAIN = process.env.EXOTEL_SUBDOMAIN ?? "api.in.exotel.com";
const EXOTEL_EXOPHONE = process.env.EXOTEL_EXOPHONE ?? ""; // your exophone
const WEBHOOK_SECRET = process.env.EXOTEL_WEBHOOK_SECRET ?? "";

type JsonObj = Record<string, unknown>;

function isObj(x: unknown): x is JsonObj {
  return typeof x === "object" && x !== null;
}
function getStr(body: JsonObj, key: string): string {
  const v = body[key];
  return typeof v === "string" ? v.trim() : "";
}
function normalizePlate(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]+/g, "");
}
function normalizeMsisdn(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 10) return "91" + digits;
  return digits;
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ ok: false, error: "Supabase env missing" }, { status: 500 });
    }
    if (!EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_SID || !EXOTEL_EXOPHONE) {
      return NextResponse.json({ ok: false, error: "Exotel env missing" }, { status: 500 });
    }

    const raw = (await req.json().catch(() => ({}))) as unknown;
    const body: JsonObj = isObj(raw) ? raw : {};

    const plate = normalizePlate(getStr(body, "plate"));
    const callerPhone10 = getStr(body, "caller_phone");
    const mode = getStr(body, "mode"); // "owner" | "emergency"

    if (!plate) return NextResponse.json({ ok: false, error: "Missing plate" }, { status: 400 });
    if (!callerPhone10) return NextResponse.json({ ok: false, error: "Missing caller_phone" }, { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // vehicle -> owner
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("plate, owner_id, active")
      .eq("plate", plate)
      .eq("active", true)
      .maybeSingle();

    if (vErr) return NextResponse.json({ ok: false, error: vErr.message }, { status: 500 });
    if (!vehicle) return NextResponse.json({ ok: false, error: "Vehicle not found" }, { status: 404 });

    const { data: owner, error: oErr } = await supabase
      .from("profiles")
      .select("id, phone, emergency_phone")
      .eq("id", vehicle.owner_id)
      .maybeSingle();

    if (oErr) return NextResponse.json({ ok: false, error: oErr.message }, { status: 500 });
    if (!owner) return NextResponse.json({ ok: false, error: "Owner profile not found" }, { status: 404 });

    const ownerPhone = owner?.phone ? normalizeMsisdn(owner.phone) : "";
    const emergencyPhone = owner?.emergency_phone ? normalizeMsisdn(owner.emergency_phone) : "";

    const to =
      mode === "emergency"
        ? emergencyPhone || ownerPhone
        : ownerPhone || emergencyPhone;

    if (!to) return NextResponse.json({ ok: false, error: "No target phone set" }, { status: 400 });

    // IMPORTANT: From = caller phone (scanner), CallerId = ExoPhone
    const from = normalizeMsisdn(callerPhone10);

    const url = `https://${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}/Calls/connect.json`;
    const form = new URLSearchParams();
    form.set("From", from);
    form.set("To", to);
    form.set("CallerId", EXOTEL_EXOPHONE);
    form.set("CallType", "trans");

    // ✅ status webhook (production)
    if (WEBHOOK_SECRET) {
      form.set("StatusCallbackUrl", `https://qratech.in/api/exotel/webhook?secret=${encodeURIComponent(WEBHOOK_SECRET)}`);
    }

    const auth = Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString("base64");

    const exotelRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const text = await exotelRes.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch {}

    if (!exotelRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Exotel call failed", exotel: parsed },
        { status: exotelRes.status }
      );
    }

    const callSid =
      (parsed as { Call?: { Sid?: string } })?.Call?.Sid ?? null;

    return NextResponse.json({ ok: true, callSid, exotel: parsed }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unhandled error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
