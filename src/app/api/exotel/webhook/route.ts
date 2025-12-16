export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const EXOTEL_WEBHOOK_SECRET = process.env.EXOTEL_WEBHOOK_SECRET ?? "";

type JsonObj = Record<string, unknown>;

function ok() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
function bad(msg: string, code = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status: code });
}

async function readBody(req: Request): Promise<JsonObj> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = (await req.json().catch(() => ({}))) as unknown;
    if (typeof j === "object" && j !== null) return j as JsonObj;
    return {};
  }

  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj: JsonObj = {};
  params.forEach((v, k) => (obj[k] = v));
  return obj;
}

function pickString(obj: JsonObj, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return bad("Supabase env missing", 500);

    // simple guard with ?secret=
    if (EXOTEL_WEBHOOK_SECRET) {
      const url = new URL(req.url);
      const secret = url.searchParams.get("secret") ?? "";
      if (secret !== EXOTEL_WEBHOOK_SECRET) return bad("Unauthorized webhook", 401);
    }

    const payload = await readBody(req);

    const callSid = pickString(payload, ["CallSid", "Sid", "call_sid"]);
    const status = pickString(payload, ["Status", "CallStatus", "status"]);
    const eventType = pickString(payload, ["EventType", "event", "Event"]) ?? status ?? "unknown";
    const fromNumber = pickString(payload, ["From", "from", "CallFrom"]);
    const toNumber = pickString(payload, ["To", "to", "CallTo"]);

    if (!callSid) return bad("Missing call sid in webhook payload", 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    await supabase.from("exotel_call_events").insert({
      call_sid: callSid,
      event_type: eventType,
      status: status,
      from_number: fromNumber,
      to_number: toNumber,
      raw: payload,
    });

    if (status) {
      await supabase.from("emergency_calls").update({ status }).eq("exotel_call_sid", callSid);
    }

    return ok();
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Webhook error", 500);
  }
}
